const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});
// This adds to our schema a field for username, a field for password,
// makes sure that the username is unique, and gives us some additional
// methods that we can use.
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);