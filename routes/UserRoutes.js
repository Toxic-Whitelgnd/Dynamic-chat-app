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

user_route.use('/public/',express.static('./public'));
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
        cb(null, path.join(__dirname,'../public/images/'));
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

// for groups get and post
user_route.get('/groups',auth.isLogin, userController.groupsLoad);
user_route.post('/groups',upload.single('image'), userController.groups);

user_route.post('/get-members',auth.isLogin, userController.getMembers);
user_route.post('/add-members',auth.isLogin, userController.addMembers);

user_route.post('/update-chat-group',auth.isLogin,upload.single('image'),userController.updateChatGroup);
user_route.post('/delete-chat-group',auth.isLogin,userController.deleteChatGroup);
user_route.get('/share-group/:id',userController.shareGroup);
user_route.post('/join-group',userController.joinGroup);
user_route.get('/group-chat',auth.isLogin,userController.groupChat);

user_route.post('/group-chat-save',userController.saveGroupChat);
user_route.post('/load-group-chat',userController.loadGroupChat);
user_route.post('/delete-group-chat',userController.deleteGroupChat);
user_route.post('/update-group-chat',userController.updateGroupChat);

// for subscription page
user_route.get('/subscription',userController.subscription);
user_route.post('/payment-page',auth.isLogin,userController.paymentPage);
user_route.post('/update-premium-user',auth.isLogin,userController.updatePremiumUser);

// for supermodel regestration
user_route.get('/supersregisterload',userController.supersregisterload);
user_route.post('/supersregister',upload.single('image'),userController.superSregister);
user_route.post('/save-supreme-chat',userController.saveSchat);
user_route.post('/delete-supreme-chat',userController.deleteSchat);
user_route.post('/update-supreme-chat',userController.updateSchat);
user_route.get('/supersloginload',userController.supersloginload);
user_route.post('/superslogin',userController.superSLogin);
user_route.get('/supersdash',userController.supresdash);
user_route.get('/logouts', auth.isLogin,userController.superslogout);
// doesnt match any route it will redirect to login page
user_route.get('*', function (req, res) {
    res.redirect('/');
})

module.exports = user_route;