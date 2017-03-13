var express = require('express');

var libs = process.cwd() + '/libs/';

var oauth2 = require(libs + 'auth/oauth2');
var log = require(libs + 'log')(module);
var cors = require('cors');
var config = require(libs + 'config');
var router = express.Router();

var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    if (config.get("cors:origins").indexOf(req.header('Origin')) !== -1) {
        corsOptions = {origin: true}; // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = {origin: false}; // disable CORS for this request
    }
    callback(null, corsOptions); // callback expects two parameters: error and options
};

router.options('/token', cors(corsOptionsDelegate));
router.post('/token', cors(corsOptionsDelegate), oauth2.token);

module.exports = router;