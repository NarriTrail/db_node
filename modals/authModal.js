const mongoose = require('mongoose')
// const validator=require('validator')
const bcrypt = require('bcrypt')
const crypto= require('crypto')
const authSchema= new mongoose.Schema({
    fullName:{
        type :String,
        maxLength:20,
        minLength:3,
        required: [true,"Please provide a full name"],
    },
    email:{
        type :String,
        maxLength:20,
        minLength:3,
        required: [true,"Please provide a email address"],
        unique:true,
        validate:{
            validator:function(val){
                return val.length>8
            }
        }
    },
    password:{
        type :String,
        maxLength:20,
        minLength:3,
        required: [true,"Please provide a password"],
        validate:{
            validator:function(val){
                return val.length>7
            }
        }
    },
    confirmPassword:{
        type :String,
        maxLength:20,
        minLength:3,
        required: [true,"Please provide a confirm password"],
        validate:{
            validator:function(val){
                return val.length>7
            }
        }
    },
    resetPasswordToken:String,
    resetPasswordExpires:Date,

})
authSchema.pre('save',async function(next){
    // console.log("called save")
    this.password= await bcrypt.hash(this.password,8)
    this.confirmPassword=undefined // we are not saving confirm password in the database so we are undefining it here before saving it.
   return next()
})
authSchema.methods.checkPassword=async(clientpassword,dbPassword)=>{
    const res= await bcrypt.compare(clientpassword,dbPassword)
    return res
    // bcrypt.compare(candidatePassword, hashedPassword, function(err, isMatch) {
    //     if (err) throw err;
    //     console.log('Is password valid?', isMatch);
    // });
}
authSchema.methods.forgotPassword=async function(){
    const token=crypto.randomBytes(20).toString('hex')//token creation
    this.resetPasswordToken=crypto.createHash('sha256').update(token).digest('hex')//token hashing
    let currentStamp=Date.now()
    const indianStam= 5.5*60*60*1000
    currentStamp=currentStamp+indianStam
    this.resetPasswordExpires=currentStamp+ (10*60*1000) // 1 hour
    console.log(token,"date exp:",this.resetPasswordExpires,'encrypted:',this.resetPasswordToken)
    return token
    // await this.save()
    // send email with the token
    // console.log(token)
}
const Auth= mongoose.model('auth',authSchema)
module.exports=Auth