// If the user is not loggedin and trying to access the dashboard route he will be redirected
const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user){
          
        }
        else{
            res.redirect('/')
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
   
}
// if the user is already logged in and trying to access the register or login route he will be directly routed to dashboard
const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user){
            res.redirect('/dashboard')
        }
        next();
    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    isLogin,
    isLogout,
}