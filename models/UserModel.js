// DEFINING THE USER MODEL

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    is_online:{
        type:String,
        default:'0',
    },
    is_supreme_user:{
        type:String,
        default:'0',
    },
    is_deulex_user:{
        type:String,
        default:'0',
    },
    is_ultra_deulex_user:{
        type:String,
        default:'0',
    },
    payment_id:{
        type:String,
        default:'',
    },
    order_id:{
        type:String,
        default:'',
    },
    payment_signature:{
        type:String,
        default:'',
    }
},
{timestamps:true}
)

module.exports = mongoose.model('User', UserSchema);