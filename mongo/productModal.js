const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mySchema = new Schema({
  productname: String,
  productdescription: String,
  productprice: Number,
  productimg: String,
  stock: Number
});

const MyModel = mongoose.model('products', mySchema);

module.exports = MyModel;