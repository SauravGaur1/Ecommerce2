const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// cartItem schema
const cartItem = require('./cartItem');

const mySchema = new Schema({
    username: String,
    password: String,
    usermail: String,
    otp: String,
    isVerified: Number,
    cartItems: [],
    userimage: String
});

mySchema.index( {username: 1 }, { unique: true })

const MyModel = mongoose.model('users', mySchema);


module.exports = MyModel;