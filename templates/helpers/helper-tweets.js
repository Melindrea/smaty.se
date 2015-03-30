'use strict';
module.exports.tweets = function (key) {
    var YAML = require('yamljs'),
        Handlebars = require('handlebars'),
        tweetConfig =  YAML.load(__dirname + '/../../data/tweets.yaml'),
        tweets;

    if (key in tweetConfig) {
        tweets = tweetConfig[key].content;
        return new Handlebars.SafeString(tweets.join('\n'));
    }
};
