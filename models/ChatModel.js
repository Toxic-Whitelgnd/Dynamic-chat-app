// mongodb+srv://whitelegend56:xYF6exMBZqXQLDfI@website.ddp2glq.mongodb.net/play-boiapp

// DEFINING THE CHAT MODEL

const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    sender_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    reciver_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    message:{
        type:String,
        required:true,
    }
},
{timestamps:true}
)

module.exports = mongoose.model('Chat', ChatSchema);