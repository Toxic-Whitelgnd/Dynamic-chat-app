// mongodb+srv://whitelegend56:xYF6exMBZqXQLDfI@website.ddp2glq.mongodb.net/play-boiapp

// DEFINING THE Group MODEL

const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    creator_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    limit:{
        type:Number,
        required:true,
    },
},
{timestamps:true}
)

module.exports = mongoose.model('Group', GroupSchema);