require('dotenv').config; 

const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://whitelegend56:xYF6exMBZqXQLDfI@website.ddp2glq.mongodb.net/dynamic-chat-app");
const app = require('express')();
const http = require('http').Server(app);
const useroute = require("./routes/UserRoutes");


app.use('/',useroute);

http.listen(9999,()=>{
    console.log("listening on");
    console.log("http://localhost:9999");
});