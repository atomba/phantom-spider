/* eslint-env phantomjs */

/* globals document: true */

const url           = require("url"),
      config        = require("config"),
      path          = require("path");
      _             = require("lodash");

var phantomAPI      = require("phantom"),
    Crawler         = require("jes-spider"),
    colors          = require("colors/safe"),
    phantomjs       = require("phantomjs"),
    dateFormat      = require('dateformat');

var MessageServer   = require("tyo-mq"),
    Queue           = require('./queue');