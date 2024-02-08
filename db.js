const mongoose = require('mongoose')

const mongoURI = "mongodb://localhost:27017/bshm?directConnection=true"

async function connectToMongo() {
    try {
      await mongoose.connect(mongoURI);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

module.exports = connectToMongo;