var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var Note = require(libs + 'model/note');
var passport = require('passport');
var service = {};


var abac = require('abac');

abac.set_policy('in-memory', 'view note', true);
abac.set_policy('in-memory', 'create note', true);
abac.set_policy('in-memory', 'update note', true);
abac.set_policy('in-memory', 'delete note', true);
abac.set_policy('in-memory', 'import notes', true);
abac.set_policy('in-memory', 'notes', function(req) {
    log.info(req.user.username);
    return true;
    // if (req.user.role == 'employee') { return true; }
    // return false;
});


service.protect = function (action, rule) {
    return [
        passport.authenticate('bearer', {session: false}),
        abac.can('in-memory', rule),
        action
    ];
};

service.ensureModel = function (note) {
    if (note) {
        return {};
    }

    var status, response = {};
    status = 404;
    response.message = 'Not found';
    log.info('Not found(%d)', status);

    return {
        status: status,
        response: response
    };
};

service.handleErrors = function (error) {
    if (!error) {
        return {};
    }

    var status, response = {};
    switch (true) {
        case error.name === 'ValidationError':
            status = 400;
            response.message = error.message;
            response.errors = error.errors;
            log.info('Validation error(%d): %s', status, error.message);
            break;
        case error.name === 'CastError':
            status = 404;
            response.message = 'Not found';
            log.info('Cast error(%d): %s', status, error.message);
            break;
        default:
            status = 500;
            response.message = 'Server error';
            log.error('Internal error(%d): %s', status, error.message);
    }


    return {
        status: status,
        response: response
    };
};

service.attributes = [
    'categories',
    'lang',
    'source',
    'title',
    'text',
    'public'
];

service.setAttributes = function (note, data) {
    service.attributes.forEach(function (attribute) {
        if (data[attribute] != undefined) {
            note[attribute] = data[attribute];
        }
    })
};

service.isEmptyObject = function (object) {
    return !Object.keys(object).length;
};

service.getAll = service.protect(function (req, res) {
    var query = {};
    if (req.query.search) {
        query = {
            title: new RegExp(req.query.search, 'i')
        }
    }

    Note.find(query, function (err, notes) {
        var error = service.handleErrors(err);
        if (!service.isEmptyObject(error)) {
            res.statusCode = error.status;
            return res.json(error.response);
        }

        return res.json(notes);
    });
}, 'notes');

service.get = service.protect(function (req, res) {
    var error;
    Note.findById(req.params.id, function (err, note) {
        error = service.handleErrors(err);
        if (!service.isEmptyObject(error)) {
            res.statusCode = error.status;
            return res.json(error.response);
        }
        error = service.ensureModel(note);
        if (!service.isEmptyObject(error)) {
            res.statusCode = error.status;
            return res.json(error.response);
        }

        return res.json({status: 'OK', note: note});
    });
}, 'view note');

service.create = service.protect(function (req, res) {
    var note = new Note(req.body);
    note.save(function (err) {
        var error = service.handleErrors(err);
        if (!service.isEmptyObject(error)) {
            res.statusCode = error.status;
            return res.json(error.response);
        }

        log.info('New note validated with id: %s', note.id);
        return res.json({status: 'OK', note: note});
    });
}, 'create note');

service.update = service.protect(function (req, res) {
    var error;
    Note.findById(req.params.id, function (err, note) {
        error = service.handleErrors(err);
        if (!service.isEmptyObject(error)) {
            res.statusCode = error.status;
            return res.json(error.response);
        }
        error = service.ensureModel(note);
        if (!service.isEmptyObject(error)) {
            res.statusCode = error.status;
            return res.json(error.response);
        }

        service.setAttributes(note, req.body);

        note.save(function (err) {
            error = service.handleErrors(err);
            if (!service.isEmptyObject(error)) {
                res.statusCode = error.status;
                return res.json(error.response);
            }

            log.info("Note with id: %s updated", note.id);
            return res.json({status: 'OK', note: note});
        });
    });
}, 'update note');

service.delete = service.protect(function (req, res) {
    var error;
    Note.findByIdAndRemove(req.params.id, function (err, note) {
        error = service.handleErrors(err);
        if (!service.isEmptyObject(error)) {
            res.statusCode = error.status;
            return res.json(error.response);
        }
        error = service.ensureModel(note);
        if (!service.isEmptyObject(error)) {
            res.statusCode = error.status;
            return res.json(error.response);
        }

        log.info("Note with id: %s deleted", req.params.id);
        return res.json({message: 'Note deleted.'});
    });
}, 'delete note');

service.import = service.protect(function (req, res) {
    var
        remove = function (note) {
            return new Promise(function (resolve, reject) {
                Note.remove({title: note.title, lang: note.lang}, function (err) {
                    if (err) {
                        reject();
                    }
                    resolve(note);
                });
            });
        },
        save = function (note) {
            return new Promise(function (resolve, reject) {
                note = new Note(note);
                note.save(function (err) {
                    if (err) {
                        reject();
                    }
                    resolve(note);
                });
            });
        },
        handle = new Promise(function (resolve, reject) {
            var
                notes = [],
                data = req.body,
                length = data.length;
            data.map(function (note) {
                remove(note).then(function (note) {
                    save(note).then(function (note) {
                        length--;
                        notes.push(note);
                        if (!length) {
                            resolve(notes);
                        }
                    });
                });
            });
        });


    return handle.then(function (notes) {
        return res.json({
            status: 'OK',
            imported: notes
        });
    });
}, 'import notes');

module.exports = service;