// DEFINING THE CHAT MODEL

const mongoose = require('mongoose');

const SChatSchema = new mongoose.Schema({
    sender_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    reciver_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'SuperSUser',
    },
    message:{
        type:String,
        required:true,
    }
},
{timestamps:true}
)

module.exports = mongoose.model('SChat', SChatSchema);