const mongoose = require('mongoose');

const { Schema } = mongoose;
const BikerSchema = new Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    phoneNumber: {
        type: String,
        unique: true
    },
    profileImage: {
         type: String
    }, // Add this line
    otp: {
        type: Number
    },
    location: {
        type: {
            type: String,
            enum: ['Point'] // Only allow "Point" type for location
        },
        coordinates: {
            type: [Number] // Array of numbers [longitude, latitude]
        }
    },
    is_email_verified: {
       type: Number
    },
    datetime: {
        type: Date,
        default: Date.now
    }
});

// Define a 2dsphere index on the location field
BikerSchema.index({ location: '2dsphere' });

const Biker = mongoose.model('Biker', BikerSchema);

module.exports = Biker;
