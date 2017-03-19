var express = require('express');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var note = require(libs + 'service/note');

router.get('/note/categories', note.categories);
router.get('/notes', note.getAll);
router.get('/note/:id', note.get);
router.post('/note', note.create);
router.put('/note/:id', note.update);
router.delete('/note/:id', note.delete);
router.post('/note/import', note.import);

module.exports = router;
