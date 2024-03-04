const mongoose = require('mongoose')

const {Schema} = mongoose
const BatterySchema = new Schema({
    battery_number:{
        type:String
    },
    franchiser: {
        type: Schema.Types.ObjectId,
        ref: 'Franchiser' 
    },
    price:{
        type:Number
    },
    numberOfSwapTrips:{
        type:Number
    },
    currentSOC:{
        type:Number
    },
    thisSTSOC:{
        type:Number
    },
    lastSTSOC:{
        type:Number
    },
    lastSTSOC:{
        type:Number
    }
    
});



const Battery = mongoose.model('battery', BatterySchema );
module.exports =  Battery;