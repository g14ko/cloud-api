var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Article = require(libs + 'model/article');

var cors = require('cors');

var corsOptions = {
    origin: 'http://doc',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

router.get('/', passport.authenticate('bearer', {session: false}), cors(corsOptions), function (req, res) {

    Article.find(function (err, articles) {
        if (!err) {
            return res.json(articles);
        } else {
            res.statusCode = 500;

            log.error('Internal error(%d): %s', res.statusCode, err.message);

            return res.json({
                error: 'Server error'
            });
        }
    });
});

router.get('/:id', passport.authenticate('bearer', {session: false}), function (req, res) {

    Article.findById(req.params.id, function (error, article) {

        if (error) {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, error.message);

            return res.json({
                error: 'Server error'
            });
        }

        if (!article) {
            res.statusCode = 404;

            return res.json({
                error: 'Not found'
            });
        }

        return res.json({
            status: 'OK',
            article: article
        });
    });

});

router.post('/', passport.authenticate('bearer', {session: false}), function (req, res) {

    var article = new Article({
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        images: req.body.images
    });

    article.save(function (err) {
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

        log.info("New article created with id: %s", article.id);
        return res.json({
            status: 'OK',
            article: article
        });

    });
});

router.put('/:id', passport.authenticate('bearer', {session: false}), function (req, res) {
    var articleId = req.params.id;

    Article.findById(articleId, function (err, article) {
        if (!article) {
            res.statusCode = 404;
            log.error('Article with id: %s Not Found', articleId);
            return res.json({
                error: 'Not found'
            });
        }

        article.title = req.body.title;
        article.description = req.body.description;
        article.author = req.body.author;
        article.images = req.body.images;

        article.save(function (err) {
            if (!err) {
                log.info("Article with id: %s updated", article.id);
                return res.json({
                    status: 'OK',
                    article: article
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
