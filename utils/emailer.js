const nodeMailer= require('nodemailer')
const sendMail = async(options)=>{
const transporter =  nodeMailer.createTransport({
    host:process.env.emailHost,
    port:process.env.emailPort,
    auth:{
        user:process.env.emailUsername,
        pass:process.env.emailPassword
    }
})
await transporter.sendMail({
    from:"heloworld@gmail.com",
    to:options.email,
    subject:options.subject,
    text:options.text
})
}
const sendOtpForMail=async(options)=>{
    console.log("otp sent functionality start")
    const transporter=nodeMailer.createTransport({
        service:'gmail',
        auth:{
            user:process.env.emailUsername,
            pass:process.env.emailPassword
        }
    })
  await  transporter.sendMail({
        from:process.env.emailUsername,
        to:'nareshbatta944@gmail.com',
        subject:'OTP Verification',
        text:`Your OTP is ${options.otp}`
    })
    console.log("otp sent functionality last")
}
function generateRandomOTP() {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }
module.exports ={sendMail,sendOtpForMail,generateRandomOTP}