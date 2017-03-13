var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Note = require(libs + 'model/note');

var cors = require('cors');

var corsOptions = {
    origin: 'http://cloud-admin',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

router.get('/notes', passport.authenticate('bearer', {session: false}), cors(corsOptions), function (req, res) {

    Note.find(function (err, notes) {
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

router.options('/note', cors(corsOptions));

router.post('/note', passport.authenticate('bearer', {session: false}), cors(corsOptions), function (req, res) {

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
