require('dotenv').config; 

const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://whitelegend56:xYF6exMBZqXQLDfI@website.ddp2glq.mongodb.net/dynamic-chat-app");
const app = require('express')();
const http = require('http').Server(app);
const useroute = require("./routes/UserRoutes");
const io = require('socket.io')(http);
const User = require("./models/UserModel");

var userver = io.of('/user-server');

userver.on('connection',async function(socket){
    console.log("User connected to server");
    
    var userId = socket.handshake.auth.token;

    // using broadcast we can listen to the entire project when any one of the user logins
    socket.broadcast.emit('getOnlineUser', {user_id: userId});

    await User.findByIdAndUpdate({_id: userId}, {$set:{is_online:'1'}});

    socket.on('disconnect',async function(){
        console.log("User disconnected from server");
        await User.findByIdAndUpdate({_id: userId}, {$set:{is_online:'0'}});

        socket.broadcast.emit('getOfflineUser',{user_id:userId});
    });
});

app.use('/',useroute);

http.listen(9999,()=>{
    console.log("listening on");
    console.log("http://localhost:9999");
});