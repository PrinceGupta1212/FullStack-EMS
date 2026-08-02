import mongoose from "mongoose";

const attendanceSchema= new mongoose.Schema({
    employeeId:{type:mongoose.Schema.Types.ObjectId,ref:"Employee",required:true},
    date:{type:Date,required:true},
    checkIn:{type:Date,default:null},
    checkOut:{type:Date,default:null},
    status:{type:String,enum:["PRESENT","ABSENT","LATE"],default:"PRESENT"},
    workingHours:{type:Number,default:null},
    dayType:{type:String,enum:["full Day","Three Quarter Day","Half Day","Short Day",null],default:null}
},
{
    timestamps:true
})
attendanceSchema.index({employeeId:1,date:1,},{unique:true})

const Attendance = mongoose.model.Attendance ||  mongoose.model("Attendance",attendanceSchema)

export default Attendance;