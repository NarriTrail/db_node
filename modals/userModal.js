const mongoose = require('mongoose')
const modalSchema=mongoose.Schema({
    name:{
        type:String,
        required: [true,"please provide name "],
    },
    age:{
        type:Number,
        default: Math.floor(Math.random() * (30 - 10 + 1)) + 10,
    },
    email:{
        type:String,
        unique: true,
    },
    mobile:{
        type:Number,
        required: [true,"please provide mobile number"],
        minLength:10,
        default:Number(`83839756${Math.floor(Math.random() * (30 - 10 + 1)) + 10}`)
    },
    createdAt:{
        type :Date,
        default: Date.now(),
    },
    hobbies:{
        type: [String],
        required: true,
        // minlength: 1,
        // maxlength: 5,
        // validate: {
        //     validator: function(v) {
        //         return v.every(hobby => /^[a-zA-Z]+$/.test(hobby));
        //     },
        //     message: "hobbies should be in alphabets only"
        // }
    },
    rank:{
        type: Number,
        required: true,
        default: Math.floor(Math.random() * 101)
    }
 
},{toJSON:{virtuals:true},toObject:{virtuals:true}})
//virtual properties these are not the direct properties of the document,so we can't use them in queries
modalSchema.virtual('ageInMonths').get(function(){
    return this.age * 12
})
modalSchema.pre('save',function(){
    //if we want to add a functionality before going to save the document then this middleware will be called
    // this is used to add addtional functionality
    //this.creadtedBy="auth.Username"
    console.log("helo docs",this)
})
modalSchema.post('save',function(docs,next){
    //if we want to add a functionality after going to save the document then this middleware will be called
    console.log("after save docs",docs)
    next()
})
modalSchema.pre('find',function(next){
    // /^find/ if we apply this regex then  this middleware will call to all the query methods  starts with find
    console.log("query middleware logged")
    this.find({age:{$gte:14}})
next()
})
//we can add multiple middleware on same event all those gets executed before/after the event is executed
module.exports=mongoose.model('userInfo',modalSchema)
// const modalSchema=mongoose.Schema({
//     name:{
//         type:String,
//         required: true,
//     },
//     age:{
//         type:Number,
//         default: 10,
//     },
//     email:{
//         type:String,
//         unique: true,
//     },
//     mobile:{
//         type:Number,
//         required: true,
//     }
 
// })
// const EachDocument=mongoose.model('userInfo',modalSchema)
// const eachUser= EachDocument({
//     name: "ramesh",
//     age: 23,
//     email: "ramesh@example.com",
//     mobile: 9234567891
// })
// eachUser.save().then((doc)=>{
//     console.log("details :",doc)
// }).catch((err)=>{
//     console.log("error :",err)
// })