require('dotenv').config; 

const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://whitelegend56:xYF6exMBZqXQLDfI@website.ddp2glq.mongodb.net/dynamic-chat-app");
const app = require('express')();
const http = require('http').Server(app);
const useroute = require("./routes/UserRoutes");
const io = require('socket.io')(http);
const User = require("./models/UserModel");
const Chat = require("./models/ChatModel");
const SChat = require("./models/SupremeChatModel");
const DChat = require("./models/DeulexModel/DeulexChatModel");

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
    
    // getting the broadcast from new grp msg 
    socket.on('groupnewChat',(data)=>{
        socket.broadcast.emit('loadnewGroupChat',data);
    })
    
    // geeting the broadcast from deleted msg
    socket.on('GroupchatDeleted',(data)=>{
        socket.broadcast.emit('GroupchatDeletedmsg',data);
    })

    // getting the broadcast from updated grp msg
    socket.on('GroupchatUpdated',(data)=>{
        socket.broadcast.emit('GroupchatUpdatedmsg',data);
    });

    // for supermodal supreme
    // starting here
    socket.on('newSChat',(data)=>{
        socket.broadcast.emit('loadnewSChat',data);
    })

    // loading the exist chat
    socket.on('loadExistSChat',async (data)=>{
        console.log("came to s load exit chat");
        var chats = await SChat.find({
            $or:[
                {sender_id:data.sender_id,reciver_id:data.reciver_id},
                {sender_id:data.reciver_id,reciver_id:data.sender_id},
            ]
        })
      
        // firing the exit caht after getting
        socket.emit('GetExistSChat',{chats:chats});
    });

    // for deleting message
    socket.on('SchatDeleted',(id)=>{
        socket.broadcast.emit('SchatmessageDeleted',id);
    });
    // for updating the message
    socket.on('SchatUpdated',(data)=>{
        socket.broadcast.emit('SchatmessageUpdated',data);
    });

    // ending here

    // for supermodal DEULEX
    // starting here
    socket.on('newDChat',(data)=>{
        socket.broadcast.emit('loadnewDChat',data);
    })

    // loading the exist chat
    socket.on('loadExistDChat',async (data)=>{
        console.log("came to s load exit chat");
        var chats = await DChat.find({
            $or:[
                {sender_id:data.sender_id,reciver_id:data.reciver_id},
                {sender_id:data.reciver_id,reciver_id:data.sender_id},
            ]
        })
      
        // firing the exit caht after getting
        socket.emit('GetExistDChat',{chats:chats});
    });

    // for deleting message
    socket.on('DchatDeleted',(id)=>{
        socket.broadcast.emit('DchatmessageDeleted',id);
    });
    // for updating the message
    socket.on('DchatUpdated',(data)=>{
        socket.broadcast.emit('DchatmessageUpdated',data);
    });

    // ending here
});

app.use('/',useroute);

http.listen(9999,()=>{
    console.log("listening on");
    console.log("http://localhost:9999");
});