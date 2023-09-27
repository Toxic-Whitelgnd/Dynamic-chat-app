// mongodb+srv://whitelegend56:xYF6exMBZqXQLDfI@website.ddp2glq.mongodb.net/play-boiapp

// DEFINING THE CHAT MODEL

const mongoose = require('mongoose');

const GroupChatSchema = new mongoose.Schema({
    sender_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    group_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Group',
    },
    message:{
        type:String,
        required:true,
    }
},
{timestamps:true}
)

module.exports = mongoose.model('GroupChat', GroupChatSchema);