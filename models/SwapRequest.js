const mongoose = require('mongoose')

const {Schema} = mongoose
const SwapRequestSchema = new Schema({
    biker: {
        type: Schema.Types.ObjectId,
        ref: 'biker' 
    },
    franchiser: {
        type: Schema.Types.ObjectId,
        ref: 'Franchiser' 
    },
    battery: {
        type: Schema.Types.ObjectId,
        ref: 'Battery' 
    },
    status: {
        type: String,
        enum: ['swapped', 'cancelled', 'pending'],
        required: true
    },
    request:{
        type: String,
        enum: ['accept', 'reject'],
        required: true
    },
    amount:{
        type: String,
        enum: ['paid', 'unpaid'],
        required: true
    }
    
});



const SwapRequest = mongoose.model('swaprequest', SwapRequestSchema );
module.exports =  SwapRequest;