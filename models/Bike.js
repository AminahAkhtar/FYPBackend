const mongoose = require('mongoose')

const {Schema} = mongoose
const BikeSchema = new Schema({
    bike_number:{
        type:String,
        required: true
    },
    biker: {
        type: Schema.Types.ObjectId,
        ref: 'Biker' 
    },
    numberOfTrips:{
        type:Number,
        required: true
    },
    numberOfSpeedInTrips:{
        type:Number,
        required: true
    },
    distance:{
        type:Number,
        required: true
    },
    avgSpeedCurrentTrip:{
        type:Number,
        required: true
    },
    avgSpeedLastTrip:{
        type:Number,
        required: true
    },
    avgSpeed:{
        type:Number,
        required: true
    }
    
});



const Bike = mongoose.model('bike', BikeSchema );
module.exports =  Bike;