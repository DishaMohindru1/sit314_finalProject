const mongoose = require('mongoose');

module.exports = mongoose.model('AirCond', new mongoose.Schema({
  name: String,
  floor: String,
  room: String,
  status: Boolean,
  humid: Array,
  gas: Array
}, { collection : 'acond' }));