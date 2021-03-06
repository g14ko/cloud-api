var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var methodOverride = require('method-override');

var libs = process.cwd() + '/libs/';
require(libs + 'auth/auth');

var config = require('./config');
var log = require('./log')(module);
var oauth2 = require('./auth/oauth2');

var oauth = require('./routes/oauth');
var api = require('./routes/api');
var users = require('./routes/users');
var articles = require('./routes/articles');
var note = require('./routes/note');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(methodOverride());
app.use(passport.initialize());

var cors = require('cors');

var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    if (config.get("cors:origins").indexOf(req.header('Origin')) !== -1) {
        corsOptions = {origin: true}; // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = {origin: false}; // disable CORS for this request
    }
    callback(null, corsOptions); // callback expects two parameters: error and options
};
app.options('*', cors(corsOptionsDelegate));
app.get('*', cors(corsOptionsDelegate));
app.post('*', cors(corsOptionsDelegate));
app.put('*', cors(corsOptionsDelegate));
app.delete('*', cors(corsOptionsDelegate));

app.use('/', oauth);
app.use('/', api);
app.use('/api', api);
app.use('/api', note);
app.use('/api/users', users);
app.use('/api/article', articles);
app.use('/api/articles', articles);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.status(404);
    log.debug('%s %d %s', req.method, res.statusCode, req.url);
    return res.json({
        error: 'Not found'
    });
});

// error handlers
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    log.error('%s %d %s', req.method, res.statusCode, err.message);
    return res.json({
        error: err.message
    });
});

module.exports = app;