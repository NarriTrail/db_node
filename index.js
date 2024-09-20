const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose= require("mongoose");
const User= require('./modals/userModal')
const Auth= require('./modals/authModal')
const jwt= require('jsonwebtoken')
const util= require('util')
const {sendEmail,sendOtpForMail,generateRandomOTP}= require('./utils/emailer')
const crypto= require('crypto')
const ratelimit= require('express-rate-limit')
dotenv.config();
app.use(express.json());
mongoose.connect(process.env.Mongo_Atlas,{
    useNewUrlParser: true
})
.then(()=>{
    console.log('mongodb connected successfully')
})
.catch((err)=>{
    console.log("the error is:",err)
})
const ApiFeature= require('./utils/apiFeatures')
app.get("/", (req, res) => {
    res.send("helo jack");
});
let limiter= ratelimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
})
app.use('/authusers/forgetpassword',limiter)
app.post('/adduser',async(req,res)=>{
try {
    const {name,email,age,mobile,hobbies}=req.body
    const details= new User({name,email,age,mobile,hobbies})
    const result=await details.save()
    await res.status(201).json(result)
} catch (error) {
    res.status(500).json({
        message: error.message,
    })
}
})
const getToken=(id)=>{
    const token= jwt.sign({id},'randomstring',{expiresIn:30000})
    return token
}
app.get('/userdetails',async(req,res,next)=>{
    if (!req.headers.authorization) {
        res.status(403).json({
            message: 'No token provided',
        })
    }

    console.log(req.headers.authorization,"sdhhsgh--->")
    const token=req.headers.authorization.split(' ')[1]
    if (!token) {
        res.status(403).json({
            message: 'No token provided===>',
        })
    }
    const validToken=await util.promisify(jwt.verify)(token,'randomstring')
    console.log(validToken,"sdhsgh--->")
    if (!validToken) {
        res.status(401).json({
            message: 'Token is not valid',
        })
    }
    // const decoded= jwt.verify(token,'randomstring')
    // console.log(decoded,"token--->")
    //here random string should be taken from the .env variable
    const user= await User.find({_id:validToken.id})
    if(!user){
        return res.status(401).json({message:'unauthorized'})
    }
    // res.json(user)
    // req.user=user
    next()
},async( req, res)=>{
try {
    // const data= await User.find(req.query).select('-__v')
    // console.log(Object.keys(req.query).length!==0)
    // const data=Object.keys(req.query).length!==0? await User.find().where('age').gte(req.query.age):await User.find()
    console.log(req.query,"query obj logged")
    let filter = { ...req.query };

    // Remove the sort field from the filter object if it exists
    if (filter.sort) {
        delete filter.sort;
    }
        let query = User.find(filter).select("-__id");
        if (req.query?.sort) {
            console.log("Sort parameter received:", req.query.sort);
            query = query.sort(req.query.sort)
        } else {
            query = query.sort('createdAt');
        }
        query=query
    const data= await query
    if (data.length > 0) {
        res.json({
            message: "users fetched successfully",
            count: data.length,
            data: data,
        })
    } else {
        res.json({
            message: "user not found",
            data: null,
        })
    }

} catch (error) {
    res.status(500).json({
        message: error.message,
    }) 
}
})
app.get('/withclass',async(req,res)=>{
    try {
        const features= new ApiFeature(User.find(),req.query).limitFields()
        const result= await features.query
        if (result) {
            res.status(200).json({
                message: "user fetched successfully",
                currentPage:req.query.page?req.query.page*1:1,
                data: result,
            })
        } else {
            res.send({
                status:"404",
                message: "user not found",
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
})
app.get('/userdetail',async(req,res)=>{
    try {
        const features= new ApiFeature(User.find(),req.query)
        const userQuery = {...req.query}
        const list= ['sort','limit','page','count']
        const userKeys= Object.keys(userQuery)
        list.forEach((each,ind)=>{
            if (userKeys.includes(each)) {
                delete userQuery[each]
            }
        })
        let query=User.find(userQuery)
        console.log('query',req.query)
        console.log("actual request:",req.query,"remoed keys:",userQuery)
        if (req.query?.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            console.log(sortBy)
            query= query.sort(sortBy)
        }else{
            query= query.sort('-createdAt')
        }
        const limit=3
        const totalCount=await User.countDocuments()
        const totalPages=Math.ceil(totalCount/limit)
         if (req.query.page) {
            let skip= (req.query.page-1)*limit
            query=query.skip(skip).limit(limit)
            if(skip>=totalCount) throw new Error("page not found");
        }
        if (req.query.fields) {
            const fields= req.query.fields.split(',').join(' ')
            console.log(fields,"keys------")
            query= query.select(fields)
        }
        const result= await query.exec()
        if (result) {
            res.status(200).json({
                message: "user fetched successfully",
                totalCount: totalCount,
                totalPages:totalPages,
                currentPage:req.query.page?req.query.page*1:1,
                data: result,
            })
        } else {
            res.send({
                status:"404",
                message: "user not found",
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
})
app.get('/userdetails/:id',async(req,res)=>{
    try {
        const eachUser = await User.find({_id:req.params.id})
        if (eachUser.length!==0) {
            res.json({
                message: "user fetched successfully",
                data: eachUser,
            }) 
        } else {
            res.json({
                message: "user not found",
                status: 404,
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message,
        }) 
    }
})
app.delete('/removeuser/:id',async(req,res)=>{
    try {
        const delUser=await User.deleteOne({_id:req.params.id})
        if (delUser.deletedCount!==0) {
            res.json({
                message: "User deleted successfully",
                data: delUser,
            })
        } else {
            res.json({
                message: "User not found",
            })
        }
       
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
})
app.delete('/removeusers',async(req,res)=>{
    try {
        const delUser=await User.deleteMany()
            res.json({
                message: "User deleted successfully",
                data: delUser,
            })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
})
app.put('/updateuser/:id',async(req,res)=>{
    try {
        const updateUser=await User.findByIdAndUpdate(req.params.id,req.body,{new:true})
        if (updateUser) {
            res.json({
                message: "User updated successfully",
                data: updateUser,
            })
        } else {
            res.json({
                message: "User not found",
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
})
app.get('/grouping',async(req,res)=>{
    try {
        const result= await User.aggregate([
            {
                $match:{age:{$gte:25}}
            },
            {
                $group:{
                    _id:'$age',
                    avgAge:{$avg:'$age'},
                    totalCount:{$sum:1},
                    heighestAge:{$max:'$age'},
                    lowestAge:{$min:'$age'}
                }
            }
        ])
        res.status(200).json({
            message: "data fetched successfully",
            data: result,
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
})
//aggregartion by nesting fields 
app.get('/studentsbyhobies/:hobbie',async(req,res)=>{
    try {
        const hobbie=req.params.hobbie
        const result= await User.aggregate([
            {$unwind:'$hobbies'},
            {$group:{
                _id:'$hobbies',
                totalCount:{$sum:1},
                students:{$push:'$name'}
            }},
            {$addFields:{hobbies:'$_id'}},
            {$project:{_id:0}},// which describes the desired keys or unwanyed as 0
            {$sort:{totalCount:-1}},
            {$match:{hobbies:hobbie}}
        ])
        res.status(200).json({
            message: "data fetched successfully",
            count:result.length,
            data: result,
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
})
app.post('/user/signup',async(req ,res)=>{
    try {
        const eachUser= await Auth.create({
            fullName:req.body.fullName,
            password:req.body.password,
            email:req.body.email,
            confirmPassword:req.body.confirmPassword
        })
        // const token= jwt.sign({id:eachUser._id,},'randomstring',{expiresIn:300})
        res.status(201).json({
            token: getToken(eachUser._id),
            message: "User registered successfully",
            data: eachUser,
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: 500,
        })
    }
})
app.post('/user/login',async (req,res) =>{
    try {
        const {email, password}=req.body
        if (!email || !password) {
            res.status(400).json({
                message: "please provide email and password",
                status: 400,
            })
        }
        const user= await Auth.findOne({email}).select('+password')
        console.log(user,"sdfssd")
        console.log(await user.checkPassword(password,user.password))
        if (!user || !(await user.checkPassword(password,user.password))) {
            res.status(404).json({
                status:404,
                message: "Invalid email or password",
            })
        }
        res.status(200).json({
            status:'success',
            message: "User logged in successfully",
            token: getToken(user._id),
            // token: jwt.sign({id:user._id,},'randomstring',{expiresIn:30000}),
            // data: user,
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: 500,
        })  
    }
})
app.get('/authusers',async(req,res)=>{
    try {
        const users= await Auth.find({})
        res.status(200).json({
            message: "Users fetched successfully",
            data: users,
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: 500,
        })
    }
})
app.post('/authusers/forgetpassword',async(req,res)=>{
try {
    const isuserExist = await Auth.findOne({email:req.body.email})
    if (!isuserExist) {
        return res.status(404).json({
            status: 404,
            message: "User not found",
        })
    }
    let token= await isuserExist.forgotPassword()
    await isuserExist.save({validateBeforeSave:false})
    const options={
        email:req.body.email,
        subject:"Password Reset",
        text:`Please use the following link to reset your password:${req.protocol}://${req.get('host')}/authusers/resetpassword/${token}`
    }
    await sendEmail(options)
    res.status(200).json({
        message: "Password reset link sent successfully",
        data: {token},
    })
} catch (error) {
    res.status(500).json({
        status:'Bad Request',
        message: error.message,
        statusCode: 500,
    })
}
})
app.post('/authusers/forgetpasswordotp',async(req,res)=>{
    try {
        const isuserExist = await Auth.findOne({email:req.body.email})
        if (!isuserExist) {
            return res.status(404).json({
                status: 404,
                message: "User not found",
            })
        }
        let token= await isuserExist.forgotPassword()
        console.log(token,"ewewewewewe")
        await isuserExist.save({validateBeforeSave:false})
        const options={
            email:req.body.email,
            subject:"Password Reset",
            otp:generateRandomOTP()
            // text:`Please use the following link to reset your password:${req.protocol}://${req.get('host')}/authusers/resetpassword/${token}`
        }
        await sendOtpForMail(options)
        res.status(200).json({
            message: "otp has been sent successfully",
            status: 200,
            data: {token},
        })
    } catch (error) {
        res.status(500).json({
            status:'Bad Request',
            message: error.message,
            statusCode: 500,
        })
    }
    })
app.post('/authusers/resetpassword/:token',async(req,res)=>{
    try {
        const encryptToken= crypto.createHash('sha256').update(req.params.token).digest('hex')
        let currentStamp=Date.now()
    const indianStam= 5.5*60*60*1000
    currentStamp=currentStamp+indianStam
        const userExists= await Auth.findOne({resetPasswordToken: encryptToken,resetPasswordExpires:{$gt:currentStamp}})
        if (!userExists) {
            return res.status('400').json({
                message:"invalid token or expired",
                status: 400,
            })
        }
        userExists.password=req.body.password
        userExists.confirmPassword=req.body.confirmPassword
        userExists.resetPasswordToken=undefined
        userExists.resetPasswordExpires=undefined
        await userExists.save()
        const loginToken= getToken(userExists._id)
        return res.status(201).json({
            message: "Password reset successfully",
            status:200,
            token: loginToken,

        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: 500,
        })
    }
})
//default error handling route
app.all('*',(req,res,next)=>{
    // res.status(404).json({
    //     message: "Page not found ",
    //     status: 404,
    //     result:`can found page for ${req.originalUrl} request`
    // })
    const err=new Error(`can't found page for ${req.originalUrl} request`)
    err.status="failed";
    err.statusCode=404
    next(err)
})
//global error handler
app.use((error,req,res,next)=>{
    error.status=error.status || 'error';
    error.statusCode=error.statusCode || 404;
    res.status(error.statusCode).json({
        message: error.message,
        status: error.status,
    })  
})
app.listen(3500, () => {
    console.log("Server running on port 3500");
});
