const User = require("../models/UserModel");
const Chat = require("../models/ChatModel");
const Group = require("../models/GroupModel");
const Member = require("../models/MemberModel");
const GroupChat = require("../models/GroupChatModel");
const bcrypt = require('bcrypt');
const mongoose = require("mongoose");

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
            image: 'images/' + req.file.filename,

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
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            console.log(passwordMatch);
            if (passwordMatch) {
                req.session.user = userData;
                res.cookie('user', JSON.stringify(userData));
                console.log(req.session.user);
                res.redirect('/dashboard')

            }
            else {
                res.render('login', { message: 'Wrong Password' });
            }

        }
        else {
            res.render('login', { message: 'Wrong credentials' });
        }

    } catch (error) {
        console.log(error);
    }
}


const loadDashboard = async (req, res) => {
    try {
        var users = await User.find({ _id: { $nin: [req.session.user._id] } })
        res.render('dashboard', { user: req.session.user, users: users });



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
                reciver_id: req.body.reciver_id,
                message: req.body.message,
            }
        );

        var newChat = await chat.save();

        res.status(200).send({ success: true, message: "chat inserted to db", data: newChat });
    } catch (error) {
        res.status(400).send({ success: false, message: error.message});
    }
}

// for deleting
const deleteChat = async (req, res) => {
    try {

        await Chat.deleteOne({ _id: req.body.id });

        res.status(200).send({ success: true });

    } catch (error) {
        res.status(400).send({ success: false, message: error.message});
    }
};

// for updating chat
const updateChat = async (req, res) => {
    try {

        Chat.findByIdAndUpdate({ _id: req.body.id }, {
            $set: {
                message: req.body.message,
            }
        });

        res.status(200).send({ success: true });
    } catch (error) {
        res.status(400).send({ success: false, message: error.message});
    }
};

// for groups tabs
const groupsLoad = async (req, res) => {
    try {
        const groups = await Group.find({ creator_id: req.session.user._id });
        res.render('groups', { groups: groups });
    } catch (error) {
        console.log(error.message);
    }
}

const groups = async (req, res) => {
    try {
        const grp = new Group({
            creator_id: req.session.user._id,
            name: req.body.name,
            image: "images/" + req.file.filename,
            limit: req.body.limit,
        })

        const groups = await grp.save();

        res.render('groups', { message: req.body.name + 'Group created successfully', groups: groups })
    } catch (error) {
        res.status(400).send({ success: false, message: error.message});
    }
};

// for getting members
const getMembers = async (req, res) => {
    try {
        console.log("fkk here");

        console.log(req.body.group_id);

        // bug is here need to fix it

        try {
            var users = await User.aggregate([
                {
                    $lookup: {
                        from: "members",
                        localField: "_id",
                        foreignField: "user_id",
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$group_id",new mongoose.Types.ObjectId(req.body.group_id) ] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "member"
                    }
    
                },
                {
                    $match: {
                        "_id": {
                            $nin: [new mongoose.Types.ObjectId(req.session.user._id)]
                        }
                    }
                }
            ]);
        } catch (error) {
            console.log(error);
        }
        
        console.log(users);

        res.status(200).send({ success: true, grpusers: users });
    } catch (error) {
        res.status(400).send({ success: false, message: error.message});
    }
};

const addMembers = async (req, res) => {
    try {
        // need to edit from here
        if (!req.body.members) {
            res.status(200).send({ success: false, msg: "Please select members" });
        }
        else if (req.body.members.length > parseInt(req.body.limit)) {
            res.status(200).send({ success: false, msg: "Please select less than the members limit" });
        }
        else {
            var data = [];

            const members = req.body.members;

            console.log(members);

            await Member.deleteMany({ group_id: req.body.group_id })

            for (let i = 0; i < members.length; i++) {
                data.push({
                    group_id: req.body.group_id,
                    user_id: members[i]
                })
            }

            console.log(data);

            await Member.insertMany(data);

            res.status(200).send({ success: true, msg: "Members added successfully" });
        }



    } catch (error) {
        res.status(400).send({ success: false, message: error.message});
    }
};

// for updating the chat group
const updateChatGroup = async (req, res) => {
    try {
        
        if(parseInt(req.body.limit) < parseInt(req.body.last_limit)){
            await Group.deleteMany({group_id:req.body.id});
        }

        var updateObj;

        if(req.file != undefined){
            updateObj = {
                name: req.body.name,
                image:'images/'+req.file.filename,
                limit:req.body.limit,
            }
        }
        else{
            updateObj = {
                name: req.body.name,
                limit:req.body.limit,
            }
        }

        await Group.findByIdAndUpdate({
            _id:req.body.id,
        },{
            $set:updateObj,
        })

        res.status(200).send({ success: true, msg: "Groups updated successfully" });

    } catch (error) {
        res.status(400).send({ success: false, message: error.message});
    }
};

// for deleting chat group form
const deleteChatGroup = async (req, res) => {
    try {
        
        await Group.deleteOne({_id: req.body.id});

        await Member.deleteMany({group_id:req.body.id});
      

        res.status(200).send({ success: true, msg: "Groups deleted successfully" });

    } catch (error) {
        res.status(400).send({ success: false, message: error.message});
    }
};
// for accessing the shre group link
const shareGroup = async (req, res) => {
    try {
        
        var groupdata = await Group.findOne({_id: req.params.id});
        if(!groupdata){
            res.render('error', { message:"404 NOT FOUND"});
        }
        else if(req.session.user == undefined){
            res.render('error', { message:"You need to Login to Access the link"});
        }
        else{
            var totalmembers = await Member.find({group_id:req.params.id}).count();
            var availabe = groupdata.limit - totalmembers;

            var isOwner = groupdata.creator_id == req.session.user._id ? true : false;
            var isJoined = await Member.find({group_id:req.params.id , user_id:req.session.user._id}).count();

            res.render('sharelinkgroup', {group:groupdata,totalmembers:totalmembers,availabe:availabe,isOwner:isOwner,isJoined:isJoined});
        }

    } catch (error) {
        console.log(error.message);
    }
};

//for joining the group link
const joinGroup = async (req, res) => {
    try {
        
        const members = new Member({
            group_id:req.group_id,
            user_id:req.session.user._id
        });

        await members.save();
        
        console.log("fk the members");
        console.log(members);

        res.status(200).send({ success: true, msg: "Congratulations you have joined the group sucessfully" });

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message});
    }
};
// starting a group chat
const groupChat = async (req, res) => {
    try {
        
        const mygroups = await Group.find({creator_id:req.session.user._id});
        const joinedgroups = await Member.find({user_id:req.session.user._id}).populate('group_id');

        console.log("from joined grp chats");
        console.log(joinedgroups);
        res.render('group-chat',{mygrp:mygroups,joinedgrp:joinedgroups});

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message});
    }
}
// saving group chat information
const saveGroupChat = async (req, res) => {
    try {
        
        var gchat = new GroupChat({
            sender_id:req.body.sender_id,
            group_id:req.body.group_id,
            message:req.body.message
        })

        var newGchat = await gchat.save();

        var cChat = await GroupChat.findOne({_id:newGchat._id}).populate('sender_id');

        res.status(200).send({ success: true , gChat:cChat });

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message});
    }
};

// for loading into the container
const loadGroupChat = async (req, res) => {
    try {
        
        var grpchat = await GroupChat.find({group_id:req.body.group_id}).populate('sender_id');

        console.log(grpchat);

        res.status(200).send({ success: true , grpchat: grpchat });

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message});
    }
};
// for deleting the grp chat msg
const deleteGroupChat = async (req, res) => {
    try {
        
        await GroupChat.deleteOne({_id:req.body.id})

        res.status(200).send({ success: true , msg:'chat deleted'});

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message});
    }
};

// for updating the grp chat msg
const updateGroupChat = async (req, res) => {
    try {
        
        await GroupChat.findByIdAndUpdate({_id:req.body.id},
            {
                $set:{
                    message:req.body.msg,
                }
            })

        res.status(200).send({ success: true , msg:'chat updated successfully'});

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message});
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
    groupsLoad,
    groups,
    getMembers,
    addMembers,
    updateChatGroup,
    deleteChatGroup,
    shareGroup,
    joinGroup,
    groupChat,
    saveGroupChat,
    loadGroupChat,
    deleteGroupChat,
    updateGroupChat,
    subscription,
}