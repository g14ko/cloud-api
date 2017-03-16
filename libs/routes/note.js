var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Note = require(libs + 'model/note');

var config = require(libs + 'config');
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

// var abac = require('abac');
//
// abac.set_policy('in-memory', 'view', false);
// abac.set_policy('in-memory', 'use secret feature', function(req) {
//     log.info(ok);
//     return true;
//     // if (req.user.role == 'employee') { return true; }
//     // return false;
// });

router.options('/notes', cors(corsOptionsDelegate));
router.get('/notes', passport.authenticate('bearer', {session: false}), cors(corsOptionsDelegate)/*, abac.can('in-memory', 'use secret feature')*/, function (req, res) {

    var query = {};
    if (req.query.search) {
        log.info(req.query.search);
        query = {
            title: new RegExp(req.query.search, "i")
        }
    }

    Note.find(query, function (err, notes) {
        if (!err) {
            return res.json(notes);
        } else {
            res.statusCode = 500;

            log.error('Internal error(%d): %s', res.statusCode, err.message);

            return res.json({
                error: 'Server error'
            });
        }
    });
});

router.get('/note/:id', passport.authenticate('bearer', {session: false}), function (req, res) {

    Note.findById(req.params.id, function (error, note) {

        if (error) {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, error.message);

            return res.json({
                error: 'Server error'
            });
        }

        if (!note) {
            res.statusCode = 404;

            return res.json({
                error: 'Not found'
            });
        }

        return res.json({
            status: 'OK',
            note: note
        });
    });

});

router.options('/note', cors(corsOptionsDelegate));

router.post('/note', passport.authenticate('bearer', {session: false}), cors(corsOptionsDelegate), function (req, res) {

    var note = new Note(req.body);

    note.save(function (err) {
        if (err) {
            if (err.name === 'ValidationError') {
                res.statusCode = 400;
                log.info('Internal error(%d): %s', res.statusCode, err.message);
                return res.json({
                    message: err.message,
                    errors: err.errors
                });
            }

            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.json({
                error: 'Server error'
            });
        }

        log.info("New note validated with id: %s", note.id);
        return res.json({
            status: 'OK',
            note: note
        });
    });

});

router.put('/note/:id', passport.authenticate('bearer', {session: false}), function (req, res) {
    var noteId = req.params.id;

    Note.findById(noteId, function (err, note) {
        if (!note) {
            res.statusCode = 404;
            log.error('Article with id: %s Not Found', noteId);
            return res.json({
                error: 'Not found'
            });
        }

        note.title = req.body.title;
        note.description = req.body.description;
        note.author = req.body.author;
        note.images = req.body.images;

        note.save(function (err) {
            if (!err) {
                log.info("Article with id: %s updated", note.id);
                return res.json({
                    status: 'OK',
                    note: note
                });
            } else {
                if (err.name === 'ValidationError') {
                    res.statusCode = 400;
                    return res.json({
                        error: 'Validation error'
                    });
                } else {
                    res.statusCode = 500;

                    return res.json({
                        error: 'Server error'
                    });
                }
                log.error('Internal error (%d): %s', res.statusCode, err.message);
            }
        });
    });
});

module.exports = router;
