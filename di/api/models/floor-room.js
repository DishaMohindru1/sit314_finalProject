const mongoose = require('mongoose');

module.exports = mongoose.model('Floor-Room', new mongoose.Schema({
  floor:String,
  rooms: Array
}, { collection : 'fr' }));