const mongoose = require('mongoose');

module.exports = mongoose.model('Sensor', new mongoose.Schema({
  Id: String,
  sensorData: Array
}, { collection : 'sensor' }));

