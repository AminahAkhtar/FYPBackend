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
    SOC:{
        type:Number
    },
    batterylevel:{
        type:Number
    },
    mac_address:{
        type: String
    }
    
});



const Battery = mongoose.model('battery', BatterySchema );
module.exports =  Battery;