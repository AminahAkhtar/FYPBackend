const mongoose = require('mongoose')

const {Schema} = mongoose
const FranchiserSchema = new Schema({
    name:{
        type:String
    },
    email:{
        type:String,
        unique:true
    },
    phoneNumber:{
        type:String,
        unique:true
    },
    totalBatteries:{
        type:Number
    },
    availableBatteries:{
        type:Number
    },
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number], // Array of numbers [longitude, latitude]
            required: true
        }
    },
    is_email_verified:{
        type:Number
     },
    datetime:{
        type:Date,
        default: Date.now
    }
});

// Define a 2dsphere index on the location field
FranchiserSchema.index({ location: '2dsphere' });

const Franchiser = mongoose.model('franchiser', FranchiserSchema );
module.exports =  Franchiser;