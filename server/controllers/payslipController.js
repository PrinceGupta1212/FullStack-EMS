
import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";

//Create Payslip


//POST /api/payslips
export const createPayslip = async (req,res) => {
    try {
        const {employeeId,month,year,basicSalary,allowances,deductions,netSalary} = req.body;

        if(!employeeId || !month || !year || !basicSalary){
            return res.status(400).json({error:"Missing required fields"})
        }

       netSalary = Number(basicSalary) + Number(allowances || 0) - Number(deductions || 0);
        const payslip = await Payslip.create({
            employeeId,
            month:Number(month),
            year:Number(year),
            basicSalary:Number(allowances || 0),
            deductions:Number(deductions || 0),
            netSalary,

        })
        return res.json({success:true,data:payslip})
    } catch (error) {
        return res.status(500).json({error:"Failed "});
    }
}

//get payslips
//get  /api/payslips
export const getPayslip = async (req,res) => {
    try {
        const session = req.session;
        const isAdmin = session.role == "ADMIN";
        if(isAdmin){
           const payslips = await Payslip.find().populate("employeeId").sort({createdAt:-1});
           const data = payslips.map((p) => {
            const obj = p.toObject();
            return {
                ...obj,
                id:obj._idtoString(),
                employee:obj.employeeId,
                employeeId : obj.employeeId?._id?.toString(),

            }
           })
           return res.json({data});
        }else{
            const employee = await Employee.findOne({userId:session.userId});
            if(!employee) return res.status(404).json({error:"Not Found"});
            const payslips = await Payslip.find({employeeId:employeeId._id}).sort({createdAt:-1});
            return res.json({data:payslips})
        }
    } catch (error) {
         return res.status(500).json({error:"Failed "});
    }
}

//getpayslip by id
//get /api/payslip/:id

export const getPayslipById = async (req,res) => {
    try {
        const payslip = await Payslip.findById(req.params.id).populate("employeeId").lean()
        if(!payslip){
            return res.status(404).json({error:"Payslip not found"});
        }
        const result = {
            ...payslip,
            id:payslip._id.toString(),
            employee:payslip.employeeId,

        }
        return res.json({result});
    } catch (error) {
          return res.status(500).json({error:"Failed "});
    }
}
