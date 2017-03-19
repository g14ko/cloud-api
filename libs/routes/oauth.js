var express = require('express');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var oauth2 = require(libs + 'auth/oauth2');

router.post('/token', oauth2.token);

module.exports = router;