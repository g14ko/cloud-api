var express = require('express');

var libs = process.cwd() + '/libs/';

var oauth2 = require(libs + 'auth/oauth2');
var log = require(libs + 'log')(module);
var cors = require('cors');
var config = require(libs + 'config');
var router = express.Router();

var origins = config.get("cors:origins");
var corsOptions = {
    origin: function (origin, callback) {
        var index = origins.indexOf(origin);
        callback(index !== -1 ? origins[index] : null);
    },
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

router.options('/token', cors(corsOptions));
router.post('/token', cors(corsOptions), oauth2.token);

module.exports = router;