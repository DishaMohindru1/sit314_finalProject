const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')

const mqtt = require('mqtt');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const topic = '2110994829-sensordata';

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({
    extended: true
}));

var client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on('connect', () => { 
    console.log('mqtt connected');
    client.subscribe(topic);
});

const comPort1 = new SerialPort({
path: 'COM8',
baudRate: 9600,
dataBits: 8,
stopBits: 1,
parity: 'none',
});

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://DeadStalker:DeadStalker@atlascluster.5zvcaby.mongodb.net/mydb', {useNewUrlParser: true, useUnifiedTopology: true });
console.log("Connected to MongoDB");
// Define a schema for the documents in the collection
const schema = new mongoose.Schema({
  topic: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

// Create a model for the collection
const Model = mongoose.model('Above and Beyond', schema);

const parser = comPort1.pipe(new ReadlineParser({ delimiter: '\r\n' }));

parser.on('data', (data)=> {

  const message = data;
  console.log(message);
  client.publish(topic, message);
  console.log("Data sent to MQTT");

  const document = new Model({
    topic: message.topic,
    message: data
  });
  
  document.save()
  .then((result) => {
    console.log(`Inserted message in database`);
  })
  .catch((err) => {
    console.error(`Failed to insert message: ${err}`);
  });

});