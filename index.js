const connectToMongo = require('./db');
const express = require('express')
const cors = require('cors');
const path = require('path');
connectToMongo();

const app = express()
const port = 5000


app.use(cors({
  origin: 'exp://192.168.10.5:8081',
  credentials: true, 
}));

app.use(express.json())


//Available routes

app.use('/api/biker', require('./routes/Biker'))
app.use('/api/franchiser', require('./routes/Franchiser'))
app.use('/api/bikerrequest', require('./routes/BikerRequest'))


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})