const mongoose = require('mongoose')

const {Schema} = mongoose
const FranchiserSchema = new Schema({
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
    totalBatteries:{
        type:Number,
        required:true
    },
    availableBatteries:{
        type:Number,
        required:true
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
FranchiserSchema.index({ location: '2dsphere' });

const Franchiser = mongoose.model('franchiser', FranchiserSchema );
module.exports =  Franchiser;