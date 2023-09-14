const User = require("../models/UserModel");
const Chat = require("../models/ChatModel");
const bcrypt = require('bcrypt');

const registerLoad = async (req, res) => {
    try {
        res.render('register')
    } catch (error) {
        console.log(error);
    }
}

const register = async (req, res) => {
    try {
        const passwordHash = await bcrypt.hash(req.body.password, 10);

        const newuser = new User({
            name: req.body.name,
            password: passwordHash,
            email: req.body.email,
            image: 'images/'+req.body.image
            
        })


        await User.insertMany([newuser]).then((docs) => {
            console.log(docs);
            res.render('register', { message: 'Regstration succesefull' })
        })
            .catch((err) => {
                console.log(err);
            });


    } catch (error) {
        console.log(error);
    }
}

const loginLoad = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error);
    }
}
const login = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email }); // Now it contains email,password,image,username
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            console.log(passwordMatch);
            if(passwordMatch){
                req.session.user = userData;
                res.cookie('user', JSON.stringify(userData));
                console.log(req.session.user);
                res.redirect('/dashboard')
                
            }
            else {
                res.render('login',{message:'Wrong Password'});
            }

        }
        else{
            res.render('login',{message:'Wrong credentials'});
        }

    } catch (error) {
        console.log(error);
    }
}


const loadDashboard = async (req, res) => {
    try {
        var users = await User.find({_id:{$nin:[req.session.user._id]}})
        res.render('dashboard',{user:req.session.user,users:users});
       
        
       
    } catch (error) {
        console.log(error);
    }
}

const logout = async (req, res) => {
    try {
        res.clearCookie('user');
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error);
    }
}
// this is for getting msg from frontend (to store in db) and sending response to frontend
const saveChat = async (req, res) => {
    try {

        var chat = new Chat(
            {
                sender_id: req.body.sender_id,
                reciver_id:req.body.reciver_id,
                message:req.body.message,
            }
        );

        var newChat = await chat.save();

        res.status(200).send({success:true, message:"chat inserted to db",data:newChat});
    } catch (error) {
        res.status(400).send({success:false, message:"Error from clientside"});
    }
}

// for deleting
const deleteChat = async (req, res) => {
    try {

        await Chat.deleteOne({_id:req.body.id});

        res.status(200).send({success:true});
        
    } catch (error) {
        res.status(400).send({success:false, message:"Error from clientside"});
    }
};

// for updating chat
const updateChat = async (req, res) => {
    try {
        
        Chat.findByIdAndUpdate({_id:req.body.id},{
            $set:{

            }
        });

        res.status(200).send({success:true});
    } catch (error) {
        res.status(400).send({success:false, message:"Error from clienside"});
    }
};

// for subscription page
const subscription = (req, res) => {
    try {
        res.render('subscription')
    } catch (error) {
        
    }
};

module.exports = {
    register,
    registerLoad,
    loginLoad,
    login,
    loadDashboard,
    logout,
    saveChat,
    deleteChat,
    updateChat,
    subscription,
}