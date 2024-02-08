const mongoose = require('mongoose')

const {Schema} = mongoose
const BatterySchema = new Schema({
    battery_number:{
        type:String,
        required: true
    },
    franchiser: {
        type: Schema.Types.ObjectId,
        ref: 'Franchiser' 
    },
    price:{
        type:Number,
        required:true
    },
    numberOfSwapTrips:{
        type:Number,
        required: true
    },
    currentSOC:{
        type:Number,
        required: true
    },
    thisSTSOC:{
        type:Number,
        required: true
    },
    lastSTSOC:{
        type:Number,
        required: true
    },
    lastSTSOC:{
        type:Number,
        required: true
    },
    
});



const Battery = mongoose.model('battery', BatterySchema );
module.exports =  Battery;