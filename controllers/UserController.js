const User = require("../models/UserModel");
const bcrypt = require('bcrypt');

const registerLoad = async (req,res)=>{
    try {
        res.render('register')
    } catch (error) {
        console.log(error);
    }
}

const register= async (req,res)=>{
    try {
        const passwordHash  = await bcrypt.hash(req.body.password,10);

        const newuser = new User({
            name: req.body.name,
            password: passwordHash,
            email: req.body.email,
            image: "images/"+req.body.image
        })

        await User.insertMany([newuser]).then((docs)=>{
            console.log(docs);
            res.render('register',{message:'Regstration succesefull'})
        })
        .catch((err)=>{
            console.log(err);
        });
        

    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    register,
    registerLoad
}