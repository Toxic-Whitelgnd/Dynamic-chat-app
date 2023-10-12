// DEFINING THE CHAT MODEL

const mongoose = require('mongoose');

const UDChatSchema = new mongoose.Schema({
    sender_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    reciver_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'SuperUDUser',
    },
    message:{
        type:String,
        required:true,
    }
},
{timestamps:true}
)

module.exports = mongoose.model('UDChat', UDChatSchema);