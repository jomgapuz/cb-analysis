const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  hash: {
    type: String,
    unique: true
  },
  from: String,
  to: String,
  value: String
})
module.exports = mongoose.model('Transaction', Schema)
