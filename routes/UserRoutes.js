const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/UserController');
const session = require('express-session');
const auth = require('../middleware/auth');
const cookie = require('cookie-parser');

var user_route = express();

const SESSION_SECRET = process.env.SESSION_SECRET;

console.log(SESSION_SECRET);

user_route.use(session({
    secret: 'mysecretkeyy',
    // resave: true,
    // saveUninitialized: true,
    // cookie: { secure: true }
}));
user_route.use(express.json());
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

user_route.set('view engine', 'ejs');
user_route.set('views', './views');

user_route.use(express.static('public'));

user_route.use(cookie());

const storage = multer.diskStorage({
   
    destination:function (req, file, cb) {
        cb(null, path.join(__dirname,'/public/images/'));
    },
    filename:function (req, file, cb) {
        const fname = Date.now()+'-'+file.originalname;
        console.log("inside the filename"+fname);
        cb(null, fname);
    }
})

const upload = multer( { storage: storage });

user_route.get('/', auth.isLogout,userController.loginLoad);
user_route.post('/', userController.login);
user_route.get('/logout', auth.isLogin,userController.logout);

user_route.get('/dashboard',auth.isLogin ,userController.loadDashboard);

// usercontroller methods are used here
user_route.get('/register',auth.isLogout, userController.registerLoad);
user_route.post('/register', upload.single('image'), userController.register);

// for saving chat
user_route.post('/save-chat',userController.saveChat);
// for deleting chat
user_route.post('/delete-chat',userController.deleteChat);
// for updating
user_route.post('/update-chat',userController.updateChat);

// for subscription page
user_route.get('/subscription',userController.subscription);

// doesnt match any route it will redirect to login page
user_route.get('*', function (req, res) {
    res.redirect('/');
})

module.exports = user_route;