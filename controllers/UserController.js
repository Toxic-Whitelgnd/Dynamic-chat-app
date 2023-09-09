const User = require("../models/UserModel");
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
            image: "images/" + req.body.image
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
        res.render('dashboard',{user:req.session.user});
    } catch (error) {
        console.log(error);
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    register,
    registerLoad,
    loginLoad,
    login,
    loadDashboard,
    logout,
}