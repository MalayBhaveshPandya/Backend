const mongoose=require("mongoose");
const {Schema}=mongoose;

const otpVerification=new Schema({
    userId:{
        type:String
    },
    otp:{
        type:String
    },
    createdAt:{
        type:Date
    },
    expiresAt:{
        type:Date
    }
});

module.exports =
  mongoose.models.OtpVerification ||
  mongoose.model("OtpVerification", otpVerificationSchema);
