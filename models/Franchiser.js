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
    otp:{
        type:Number,
        unique:true
    },
    otpExpiresAt: {
        type: Date,
        default: () => Date.now() + 24*60*60*1000 // 24 hours from creation
    },
    totalBatteries:{
        type:Number,
        default: 9
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

// Define a TTL index on the otpExpiresAt field
FranchiserSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });


const Franchiser = mongoose.model('franchiser', FranchiserSchema );
module.exports =  Franchiser;