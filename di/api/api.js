const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const http = require('http'); // Import https module instead of http
var sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  passphrase: 'qwerty',
};

const bodyParser = require('body-parser');
const app = express();
const port = process.env.port || 5000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Building',
      version: '1.0.0',
      description: 'API documentation generated using Swagger',
    },
  },
  apis: ['./api.js'], // Path to your API route files
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://code.highcharts.com/highcharts.js',
          'https://maps.googleapis.com',
          'https://code.jquery.com',
          'https://cdnjs.cloudflare.com',
          'https://stackpath.bootstrapcdn.com',
          'https://fonts.googleapis.com',
        ],
        connectSrc: ["'self'", 'http://localhost:3000', 'mongodb+srv://your-mongodb-url'],
        frameAncestors: ["'none'"],
        'Cross-Origin-Embedder-Policy': 'require-corp',
        imgSrc: ["'self'", 'data:'],
        styleSrc: ["'self'", 'https://maxcdn.bootstrapcdn.com', 'https://stackpath.bootstrapcdn.com', 'https://fonts.googleapis.com', "'unsafe-inline'"],
        fontSrc: ["'self'", 'https://maxcdn.bootstrapcdn.com', 'https://stackpath.bootstrapcdn.com', 'https://fonts.gstatic.com', 'https://fonts.googleapis.com', 'data:"'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
      reportOnly: false,
    },
  })
);

const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://Disha:HRnEK4EF4DnwFmKq@cluster0.hmlogwa.mongodb.net/SmartLighting', { useNewUrlParser: true, useUnifiedTopology: true });

const Device = require('./models/device');
const Lighting = require('./models/lighting');
const Security = require('./models/security');
const AirCond = require('./models/acond');
const FloorRoom = require('./models/floor-room');

// Create an HTTPS server using the provided SSL options
var server = http.createServer(app).listen(port, function () {
  console.log('Express server listening on port ' + port);
});


app.get('/test', (req, res) => {
  res.send('The API is working!');
});



/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get Rooms from a floor
 *     tags: [Rooms]
 *     parameters:
 *       - floor: String
 *         schema:
 *           floor: string
 *           rooms: Array
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */


app.get('/api/rooms', async (req, res) => {
  console.log("got a floor");
  try {
    const floor = req.query.floor;
    const floorRoom = await FloorRoom.findOne({ floor: floor }).exec();
    const rooms = floorRoom.rooms;
    res.json(rooms);
  } catch (err) {
    console.error(err);
  }
});



app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /api/remove:
 *   get:
 *     summary: Get all devices of type, room, floor
 *     tags: [devices]
 *     parameters:
 *       - type: string
 *         floor: string
 *         room: string
 *         schema:
 *           floor: string
 *           rooms: Array
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */

app.get('/api/remove', async (req, res) => {
  try {
    const type = req.query.type;
    const floor = req.query.floor;
    const room = req.query.room;
    let devices = [];

    console.log('Received GET request with query parameters:', { type, floor, room });

    if (type === '1') {
      devices = await Lighting.find({ floor: floor, room: room });
    } else if (type === '2') {
      devices = await AirCond.find({floor: floor, room: room });
    } else if (type === '3') {
      devices = await Security.find({floor: floor, room: room });
    }

    console.log('Retrieved devices:', devices);

    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Get data from a device
 *     tags: [data]
 *     parameters:
 *       - name: String
 *         type: string
 *         floor: string
 *         room: string
 *         schema:
 *           name: string
 *           status: string
 *           floor: string
 *           rooms: Array
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */

app.get('/api/data', async (req, res) => {
  try {
    const type = req.query.type;
    const floor = req.query.floor;
    const room = req.query.room;
    const name = req.query.name;
    let data = [];

    console.log('Received GET request with query parameters:', { type, floor, room, name });

    if (type === '1') {
      data = await Lighting.find({ floor: floor, room: room, name: name});
    } else if (type === '2') {
      data = await AirCond.find({floor: floor, room: room, name: name });
    } else if (type === '3') {
      data = await Security.find({floor: floor, room: room, name: name });
    }
    const sensorData = data.map((item) => item.sensorData).flat();
    console.log('Retrieved data:', sensorData);

    res.json(sensorData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
  
});

/**
 * @swagger
 * /api/remove:
 *   delete:
 *     summary: Delete device from DB
 *     tags: [device]
 *     parameters:
 *       - device: String
 *         type: string
 *         floor: string
 *         room: string
 *         schema:
 *           name: string
 *           status: string
 *           floor: string
 *           rooms: Array
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */


app.delete('/api/remove', async (req, res) => {
  try {
    const type = req.body.type;
    const floor = req.body.floor;
    const room = req.body.room;
    const device = req.body.device;

    if (type === '1') {
      await Lighting.findOneAndRemove({ floor: floor, room: room, name: device });
      console.log('Device removed successfully');
    } else if (type === '2') {
      await AirCond.findOneAndRemove({ floor: floor, room: room, name: device });
    } else if (type === '3') {
      await Security.findOneAndRemove({ floor: floor, room: room, name: device });
    }

    console.log('Device removed successfully:', type, floor, room, device);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * @swagger
 * /api/lighting:
 *   get:
 *     summary: get all lighting devices
 *     tags: [data]
 *     parameters:
 *       - 
 *         schema:
 *           name: string
 *           status: string
 *           floor: string
 *           rooms: Array
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */

app.get('/api/lighting', async (req, res) => {
  try {
    const lightingData = await Lighting.find({});
    res.json(lightingData);
  } catch (err) {
    res.status(500).send('Server error');
  }
});


/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: get all security devices
 *     tags: [security]
 *     parameters:
 *       - 
 *         schema:
 *           name: string
 *           status: string
 *           floor: string
 *           rooms: Array
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */
app.get('/api/security', async (req, res) => {
  try {
    const lightingData = await Security.find({});
    res.json(lightingData);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/aircond:
 *   get:
 *     summary: Get all data from airconditioning devices
 *     tags: [AC]
 *     parameters:
 *       - 
 *         schema:
 *           name: string
 *           status: string
 *           floor: string
 *           rooms: Array
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */
app.get('/api/aircond', async (req, res) => {
  try {
    const lightingData = await AirCond.find({});
    res.json(lightingData);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/lighting:
 *   post:
 *     summary: Get data from a device
 *     tags: [data]
 *     parameters:
 *       - name: String
 *         floor: string
 *         room: string
 *         schema:
 *           name: string
 *           status: string
 *           floor: string
 *           rooms: Array
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */

app.post('/api/lighting', async (req, res) => {
  const { name, floor, room } = req.body;
  
  console.log('Received POST request to /api/lighting');
  console.log('name:', name);
  console.log('floor:', floor);
  console.log('room:', room);
  const device = await Lighting.findOne({ name: name, floor:floor, room: room });
  if(!device){
    const newDevice = new Lighting({
    name,
    floor,
    room,
    status: false,
    sensorData: [1,10]
  });

  try {
    await newDevice.save();
    console.log('Successfully saved new device');
    res.send('successfully added device and data');
  } catch (err) {
    console.log('Error saving new device:', err);
    res.send(err);
  }
  }
  
});

/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Get data from a device
 *     tags: [data]
 *     parameters:
 *       - name: String
 *         type: string
 *         floor: string
 *         room: string
 *         schema:
 *           name: string
 *           status: string
 *           floor: string
 *           gas: Array
 *           humid: Array
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */

app.get('/api/th', async (req,res)=>{
  try {
      const name = req.query.name;
      const room = req.query.room;
      const floor = req.query.floor;

      // let temp=[];
      // let humid=[];

      const devices = await AirCond.find({ name: name, room: room, floor: floor });

      gas = devices.map((item) => item.gas).flat();
      humid = devices.map((item) => item.humid).flat();

      const response = {
        gas: gas,
        humid: humid
      };
  
      res.json(response);
  } catch (error) {
      console.error(error);
  }
});

/**
 * @swagger
 * /api/security:
 *   post:
 *     summary: add a new security device
 *     tags: [data]
 *     parameters:
 *       - name: String
 *         floor: string
 *         room: string
 *         schema:
 *           name: string
 *           status: string
 *           
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */

app.post('/api/security', async (req, res) => {
  const { name, floor, room } = req.body;
  
  console.log('Received POST request to /api/security');
  console.log('name:', name);
  console.log('floor:', floor);
  console.log('room:', room);

  const device = await Security.findOne({ name: name, floor:floor, room: room });
  if(!device){
    const newDevice = new Security({
    name,
    floor,
    room,
    status: false,
    sensorData: [2,3,4,5]
  });

  try {
    await newDevice.save();
    console.log('Successfully saved new device');
    res.send('successfully added device and data');
  } catch (err) {
    console.log('Error saving new device:', err);
    res.send(err);
  }
  }
  
});

/**
 * @swagger
 * /api/aircond:
 *   post:
 *     summary: Get airconditioning device from aircond
 *     tags: [AC]
 *     parameters:
 *       - name: String
 *         floor: string
 *         room: string
 *         schema:
 *           name: string
 *           status: string
 *           floor: string
 *           rooms: Array
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: User not found
 */

app.post('/api/aircond', async (req, res) => {
  const { name, floor, room } = req.body;
  
  console.log('Received POST request to /api/aircond');
  console.log('name:', name);
  console.log('floor:', floor);
  console.log('room:', room);
  const device = await AirCond.findOne({ name: name, floor:floor, room: room });
  if (!device) {
    const newDevice = new AirCond({
    name,
    floor,
    room,
    status: false,
    gas: [2,6,7,8,1],
    humid: [3,5,6,7]
  });

  try {
    await newDevice.save();
    console.log('Successfully saved new device');
    res.send('successfully added device and data');
  } catch (err) {
    console.log('Error saving new device:', err);
    res.send(err);
  }
  }

 
});






// const floors = [
//   {
//     floor: '1',
//     rooms: [1,2,3,4]
//   },
//   {
//     floor: '2',
//     rooms: [5,6,7,8]
//   },
//   {
//     floor: '3',
//     rooms: [9,10,11,12]
//   }
// ];

// FloorRoom.insertMany(floors).then(() => {
//   console.log('Inserted floors successfully');
// }).catch((err) => {
//   console.error('Failed to insert floors', err);
// }).finally(() => {
//   mongoose.connection.close();
// });



app.get('/devices', (req, res) => {
  Device.find({})
    .then(devices => {
      res.send(devices);
    })
    .catch(err => {
      res.send(err);
    });
});

app.post('/devices', (req, res) => {
  const { name, user, sensorData } = req.body;
  const newDevice = new Device({
    name,
    user,
    sensorData
  });
  newDevice.save(err => {
    return err
      ? res.send(err)
      : res.send('successfully added device and data');
  });
});

