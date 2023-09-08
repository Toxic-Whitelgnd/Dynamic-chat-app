const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/UserController');

var user_route = express();

user_route.use(express.json());
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended:true }));

user_route.set('view engine','ejs');
user_route.set('views','./views');

user_route.use(express.static('public'));


const ImgStorage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,"../public/images"));
    },
    filename:function(req,file,cb){
        const fname = Date.now()+'-'+file.originalname;
        cb(null,fname);
    }
})

const upload = multer({storage: ImgStorage});

// usercontroller methods are used here
user_route.get('/register',userController.registerLoad);
user_route.post('/register',upload.single('image'),userController.register);

module.exports = user_route;