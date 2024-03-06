const connectToMongo = require('./db');
const express = require('express')
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');
const path = require('path');


connectToMongo();

const app = express()
// Load your OpenAPI Specification (OAS) file
const swaggerDocument = YAML.load('swagger.yaml');

const port = 5000
app.use(cors({
  origin: 'exp://192.168.10.5:8081',
  credentials: true, 
}));

app.use(express.json())

// Serve Swagger UI at /api-docs endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//Available routes

app.use('/api/biker', require('./routes/Biker'))
app.use('/api/franchiser', require('./routes/Franchiser'))



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

