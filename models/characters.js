const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  charId: {
    type: Number,
    unique: true
  },
  charLevel: Number,
  charElement: String,
  timestamp: Number,
  ownerAddress: String
})
module.exports = mongoose.model('Character', Schema)
