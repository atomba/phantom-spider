/* eslint-env phantomjs */

/* globals document: true */

const url       = require("url"),
      config    = require("config"),
      _         = require("lodash");

var phantomAPI  = require("phantom"),
    Crawler     = require("jes-spider"),
    colors      = require("colors/safe"),
    phantomjs   = require("phantomjs");

var MessageServer = require("tyo-mq");

var seedUrl;

if (process.argv.length > 2) {
    seedUrl = process.argv[2];
}

/**
 * parse the url
 */

var createNewCrawler = function (seedUrl) {
    seedUrl = seedUrl || 'http://localhost';
    var instance = new Crawler(seedUrl);

    // load config
    // most common Chrome, Firefox, Safari user agent
    var crawlerConfig = config.get("crawler");
    for (var key in crawlerConfig) {
        if (_.isFunction(instance[key]))
            continue;

        if (key === "cache") {
            instance.cache = new Crawler.cache(crawlerConfig[key]);
        }
        else {
            instance[key] = crawlerConfig[key];
        }
    }
    return instance;
}

//var urlObj = url.parse(seedUrl);
var crawler = createNewCrawler (seedUrl);

var phantomBin = phantomjs.path,
    phantomBannedExtensions = /\.(png|jpg|jpeg|gif|ico|css|js|csv|doc|docx|pdf)$/i,
    phantomQueue = [];

// crawler.userAgent=
// crawler.respectRobotsTxt=false
// crawler.cache = new Crawler.cache('cache');

var mq = new MessageServer();
mq.start();

var consumer = mq.createConsumer(() => {
    consumer.subscribe('newlink', (newUrl) => {
        console.log("received new link: " + newUrl);
        crawler.queueURL(newUrl);

        if (Crawler.stopped) {
            crawler.start();
        }
    });
});

var producer = mq.createProducer('linkcontent');

phantomAPI.create({ binary: phantomBin }, runCrawler);

// Events which end up being a bit noisy
var boringEvents = [
    "queueduplicate",
    "fetchstart",
    "discoverycomplete"
];

// Replace original emit so we can sample all events easily
// and log them to console
var originalEmit = crawler.emit;

crawler.emit = function(name, queueItem) {
    var url = "";

    if (queueItem) {
        if (typeof queueItem === "string") {
            url = queueItem;
        } else if (queueItem.url) {
            url = queueItem.url;
        }
    }

    function pad(string) {
        while (string.length < 20) {
            string += " ";
        }
        return string;
    }

    if (boringEvents.indexOf(name) === -1) {
        console.log(colors.cyan("%s") + "%s", pad(name), url);
    }

    originalEmit.apply(crawler, arguments);
};

crawler.on("complete", /*process.exit.bind(process, 0)*/() => {
    crawler.stopped = true;
});

var redirects = {};

crawler.on("queueerror", (error, queueItem) => {
    console.error("failed to add link to queue: " + queueItem.url);
    console.error(error);
});

crawler.on("fetchredirect", (queueItem, parsedURL, response) => {
    // in lots of time, redirection is a way that is used for building up user id
    var cookieName = parsedURL.host + ".cookie";
    var newUrl = response.headers.location;
    console.log("redirected to " + newUrl);

    crawler.queueURL(newUrl);
});

function runCrawler(phantom) {
    crawler.start();
    crawler.on("queueadd", function(queueItem) {
        if (!queueItem.url.match(phantomBannedExtensions)) {
            var resume = this.wait();
            phantomQueue.push(queueItem.url);
            processQueue(phantom, resume);
        }
    });
}

function fetchPage(phantom, url, callback) {
    console.log(colors.green("Phantom attempting to load ") + colors.cyan("%s"), url);

    makePage(phantom, url, function(page, status) {
        console.log(
            colors.green("Phantom opened URL with %s — ") + colors.cyan("%s"), status, url);

        //if nothing further to do return callback();

        // we are not doing the link discovery here
        page.evaluate(processPage, function(result) {
            // if result is the dom html


            // if result is a link array
            // result.forEach(function(url) {
            //     if (url)
            //         crawler.queueURL(url);
            // });
            producer({url:url, content:result});
            callback();
        });
    });
}

function processPage () {
    return document.documentElement.outerHTML;
}

function findPageLinks() {
    var selector = document.querySelectorAll("a, link, img");
    selector = [].slice.call(selector);

    return selector
                .map(function(link) {
                    return link.href || link.onclick || link.href || link.src;
                })
                .filter(function(src) {
                    return !!src;
                });
}

function makePage(phantom, url, callback) {
    phantom.createPage(function(page) {
        page.open(url, function(status) {
            callback(page, status);
        });
    });
}

var queueBeingProcessed = false;
function processQueue(phantom, resume) {
    if (queueBeingProcessed) {
        return;
    }
    queueBeingProcessed = true;

    (function processor(item) {
        if (!item) {
            console.log(colors.green("Phantom reached end of queue! ------------"));
            queueBeingProcessed = false;
            return resume();
        }

        fetchPage(phantom, item, function() {
            // Break up stack so we don't blow it
            setTimeout(processor.bind(null, phantomQueue.shift()), 10);
        });

    })(phantomQueue.shift());
}
