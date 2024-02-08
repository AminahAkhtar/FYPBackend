const mongoose = require('mongoose')

const {Schema} = mongoose
const BikerSchema = new Schema({
    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required: true,
        unique:true
    },
    phoneNumber:{
        type:String,
        required: true,
        unique:true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'], // Only allow "Point" type for location
            required: true
        },
        coordinates: {
            type: [Number], // Array of numbers [longitude, latitude]
            required: true
        }
    },
    date:{
        type:Date,
        default: Date.now
    },
});

// Define a 2dsphere index on the location field
BikerSchema.index({ location: '2dsphere' });

const Biker = mongoose.model('biker', BikerSchema );
module.exports =  Biker;