require('dotenv').config; 

const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://whitelegend56:xYF6exMBZqXQLDfI@website.ddp2glq.mongodb.net/dynamic-chat-app");
const app = require('express')();
const http = require('http').Server(app);
const useroute = require("./routes/UserRoutes");
const io = require('socket.io')(http);
const User = require("./models/UserModel");
const Chat = require("./models/ChatModel");

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

        // firing the event so that u can catch anywhere in the program
        socket.broadcast.emit('getOfflineUser',{user_id:userId});
    });

    // getting the broadcast from dashboard 
    socket.on('newChat',(data)=>{
        socket.broadcast.emit('loadnewChat',data);
    })

    // loading the exist chat
    socket.on('loadExistChat',async (data)=>{
        
        var chats = await Chat.find({
            $or:[
                {sender_id:data.sender_id,reciver_id:data.reciver_id},
                {sender_id:data.reciver_id,reciver_id:data.sender_id},
            ]
        })
      
        // firing the exit caht after getting
        socket.emit('GetExistChat',{chats:chats});
    });

    // for deleting message
    socket.on('chatDeleted',(id)=>{
        socket.broadcast.emit('chatmessageDeleted',id);
    });
    // for updating the message
    socket.on('chatUpdated',(data)=>{
        socket.broadcast.emit('chatmessageUpdated',data);
    });
       
    
});

app.use('/',useroute);

http.listen(9999,()=>{
    console.log("listening on");
    console.log("http://localhost:9999");
});