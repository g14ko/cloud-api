var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var isNoteUnique = function (value, done) {
    if (value) {
        mongoose.models['note'].count({_id: {'$ne': this._id}, title: value, lang: this.lang}, function (err, count) {
            if (err) {
                return done(err);
            }
            // // If `count` is greater than zero, "invalidate"
            done(!count);
        });
    }
};

var note = new Schema({
    categories:  [String],
    lang: {type: String, required: true},
    title: {
        type: String,
        required: true,
        validate: [
            {validator: isNoteUnique, msg: 'Note already exists'}
        ]
    },
    text: {type: String, required: true},
    source: {type: String},
    public: {type: Boolean},
    modified: {type: Date, default: Date.now}
});

note.path('lang').validate(function (value) {
    return value.length < 32;
});

module.exports = mongoose.model('note', note);