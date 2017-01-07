/* eslint-env phantomjs */

/* globals document: true */

const url           = require("url"),
      config        = require("config"),
      path          = require("path");
      _             = require("lodash");

var Crawler         = require("jes-spider"),
    colors          = require("colors/safe"),
    dateFormat      = require('dateformat');

    Queue           = require('./queue');

var ON_DEATH = require('death'); //this is intentionally ugly 

const PHANTOM_SPIDER_QUEUE_DEFAULT = "phantom-spider-queue";

var param = 2, queueFile;
if (process.argv.length > 3) {
    for (; param < process.argv.length; ++param) {
    	var o = process.argv[param].charAt(0);
    	if (o === '-' /*&& process.argv[param].length === 2*/) {
    		var c = process.argv[param].charAt(1);
	        switch (c) {
	            case 'q':
	                queueFile = process.argv[++param];
	            break;
	            case 'p':
	                //process.argv[++param];
	            break;
	            case 's':
	                //process.argv[++param];
	            break;
	            case 'c':
	            	//process.argv[++param];
	            break;
                case '-': 
                    // long option
                    break;
                default:
                    console.log("Unknown option: " + process.argv[param]);
	        }
        }
    }
}

var seedUrl;

if (param >= 2) {
    seedUrl = process.argv[param];
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

    // Events which end up being a bit noisy
    var boringEvents = [
        "queueduplicate",
        "fetchstart",
        "discoverycomplete",
        "fetchheaders",
        "fetchdisallowed"
    ];

    // Replace original emit so we can sample all events easily
    // and log them to console
    var originalEmit = instance.emit;

    instance.emit = function(name, queueItem) {
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

        originalEmit.apply(instance, arguments);
    };

    var originalQueueURL = instance.queueURL;

    instance.queueURL = function(url, referrer, force) {
        var crawler = this,
        queueItem = (!url.url) ?  instance.processURL(url, referrer) : url;

        // URL Parser decided this URL was junky. Next please!
        if (!queueItem) {
            return false;
        }

        var filters = (crawler[queueItem.host] && crawler[queueItem.host].filters) || crawler.filters;
        if (filters) {
            var shouldIgnored = true;
            for (var i = 0; i < crawler.filters.length; ++i) {
                if (queueItem.url.match(crawler.filters[i])) {
                    shouldIgnored = false;
                    break;
                }
            }

            if (shouldIgnored)
                return false;
        }

        var bannedExtensions = (crawler[queueItem.host] && crawler[queueItem.host].bannedExtensions) || crawler.bannedExtensions;
        if (bannedExtensions && queueItem.url.match(bannedExtensions)) {
            return false;
        }

        return originalQueueURL.apply(instance, argmements);
    }

    return instance;
}

var urlHost = url.parse(seedUrl);
var crawler = createNewCrawler(seedUrl);
var queueFile = PHANTOM_SPIDER_QUEUE_DEFAULT + "_" + urlHost.host + ".json";

var onSignal = function () {
    console.log("Signal caught.");
    crawler.queue.freeze(queueFile, function () {
        process.exit();
    });
}

ON_DEATH(onSignal);

process.on('uncaughtException', function (err) {
    console.log(err);
    onSignal();
})

crawler.queue.defrost(queueFile, () => {
    crawler.start();
});