// const connectToMongo = require('./db');
// const express = require('express')
// const swaggerUi = require('swagger-ui-express');
// const YAML = require('yamljs');
// const cors = require('cors');
// const path = require('path');
// const http = require('http');
// const socketIo = require('socket.io');

// connectToMongo();

// const app = express()
// const server = http.createServer(app);
// const io = socketIo(server);
// // Load your OpenAPI Specification (OAS) file
// const swaggerDocument = YAML.load('swagger.yaml');

// const port = 5000
// app.use(cors({
//   origin: 'exp://192.168.10.5:8081',
//   credentials: true, 
// }));

// app.use(express.json())
// // Pass io object to routes
// app.set('io', io);
// // Serve Swagger UI at /api-docs endpoint
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// //Available routes

// app.use('/api/biker', require('./routes/Biker'))
// app.use('/api/franchiser', require('./routes/Franchiser'))





// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })


const connectToMongo = require('./db');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

connectToMongo();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Adjust the origin to match your client URL
    methods: ['GET', 'POST']
  }
});

// Load your OpenAPI Specification (OAS) file
const swaggerDocument = YAML.load('swagger.yaml');

const port = 5000;
app.use(cors({
  origin: 'http://localhost:3000', // Adjust the origin to match your client URL
  credentials: true,
}));

app.use(express.json());

// Pass io object to routes
app.set('io', io);

// Serve Swagger UI at /api-docs endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Available routes
app.use('/api/biker', require('./routes/Biker'));
app.use('/api/franchiser', require('./routes/Franchiser'));

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
