const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const mySchema = new Schema({
  productname: String,
  productdescription: String,
  productprice: Number,
  productimg: String,
  quantity: Number
});

const MyModel = mongoose.model('cartItem', mySchema);

module.exports = MyModel;