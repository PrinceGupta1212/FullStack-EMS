import Employee from "../models/Employee.js";
import bcrypt from 'bcrypt'
import User from "../models/User.js";

//GET employees



//get /api/employees
export const getEmployees = async (req,res) => {
    try {
        const {department} = req.query;
        const  where = {};
        if(department) where.department = department;

        where.isDeleted = { $ne: true };

        const employees = await Employee.find(where)
        .sort({createdAt:-1})
        .populate("userId","email role")
        .lean();
        const result = employees.map((emp) => ({
            ...emp,
            id:emp._id.toString(),
            user:emp.userId ? {email:emp.userId.email, role:emp.userId.role} : null
        }))

        return res.json(result)
    } catch (error) {
        return res.status(500).json({error:"Failed to fetch employees"})
    }
}

//create employeee
//post  /api/employees

export const createEmployees = async (req,res) => {

    try {
        const {firstName,lastName,email,phone,position,department,basicSalary,allowances,deductions,joinDate,password,role,bio} = req.body;
        if(!email || !password || !firstName || !lastName || !phone || !position || !joinDate){
            return res.status(400).json({error:"Missing required fields"});
        }

        const normalizedEmail = email.trim().toLowerCase();
        const parsedJoinDate = new Date(joinDate);
        if (Number.isNaN(parsedJoinDate.getTime())) {
            return res.status(400).json({ error: "Invalid join date" });
        }

        const hashed = await bcrypt.hash(password,10)
        let user = await User.findOne({ email: normalizedEmail });
        let createdUser = false;

        if (user) {
            // The profile check below handles both active and deleted employees.
            // This updates an orphaned login account before creating its profile.
            user.password = hashed;
            user.role = role || "EMPLOYEE";
            await user.save();
        } else {
            user = await User.create({
                email: normalizedEmail,
                password: hashed,
                role: role || "EMPLOYEE"
            });
            createdUser = true;
        }

        try {
            const existingEmployee = await Employee.findOne({
                $or: [{ userId: user._id }, { email: normalizedEmail }],
            });

            if (existingEmployee) {
                if (!existingEmployee.isDeleted) {
                    // A legacy employee document can have the same email but
                    // no userId (or a stale one). Repair that link so the
                    // employee can log in and use the dashboard.
                    if (!existingEmployee.userId || existingEmployee.userId.toString() !== user._id.toString()) {
                        existingEmployee.userId = user._id;
                        await existingEmployee.save();
                        return res.status(200).json({
                            success: true,
                            employee: existingEmployee,
                            restored: true,
                        });
                    }
                    return res.status(400).json({ error: "Email already exists" });
                }

                // Re-activate a soft-deleted employee rather than forcing the
                // administrator to manually remove database records.
                Object.assign(existingEmployee, {
                    userId: user._id,
                    firstName,
                    lastName,
                    email: normalizedEmail,
                    phone,
                    position,
                    department: department || "Engineering",
                    basicSalary: Number(basicSalary) || 0,
                    allowances: Number(allowances) || 0,
                    deductions: Number(deductions) || 0,
                    joinDate: parsedJoinDate,
                    bio: bio || "",
                    isDeleted: false,
                    employmentStatus: "ACTIVE",
                });
                await existingEmployee.save();
                return res.status(200).json({ success: true, employee: existingEmployee, restored: true });
            }

            const employee = await Employee.create({
                userId: user._id,
                firstName,
                lastName,
                email: normalizedEmail,
                phone,
                position,
                department: department || "Engineering",
                basicSalary: Number(basicSalary) || 0,
                allowances: Number(allowances) || 0,
                deductions: Number(deductions) || 0,
                joinDate: parsedJoinDate,
                bio: bio || ""
            });
        return res.status(201).json({success:true,employee})
        } catch (error) {
            // Avoid leaving a login account without its required employee profile.
            if (createdUser) await User.findByIdAndDelete(user._id);
            throw error;
        }
    } catch (error) {
        if(error.code === 11000){
            const duplicatedField = Object.keys(error.keyPattern || {})[0];
            if (duplicatedField === "email") {
                return res.status(400).json({error:"Email already exists"})
            }
            return res.status(409).json({
                error: "A database index conflict prevented employee creation. Run npm.cmd run migrate:employees in the server folder, then try again."
            })
        }
        console.error("Create employee error",error)
        return res.status(500).json({error:"Failed to create employee"})
    }
}

//Update employeee
//put  /api/employees/:id

export const updateEmployees = async (req,res) => {
      try {
        const {id} = req.params;
        const {firstName,lastName,email,phone,position,department,basicSalary,allowances,deductions,password,role,bio,employmentStatus} = req.body;
       
        const employee = await Employee.findById(id);
        if(!employee) return res.status(404).json({error:"Employee not Found"})

         await Employee.findByIdAndUpdate(id,{
          
            firstName,
            lastName,
            email,
            phone,
            position,
            department:department || "Engineering",
            basicSalary: Number(basicSalary) || 0,
            allowances:Number(allowances) || 0,
            deductions:Number(deductions) || 0,
           employmentStatus:employmentStatus || "ACTIVE",
            bio:bio || "",
        })
        //Update user record
        const userUpdate = {email: email.trim().toLowerCase()}
        if(role)  userUpdate.role = role;
        if(password) userUpdate.password = await bcrypt.hash(password,10)
            await User.findByIdAndUpdate(employee.userId,userUpdate)
        return res.json({success:true})
    } catch (error) {
        if(error.code === 11000){
            return res.status(400).json({error:"Email already exists"})
        }
    
        return res.status(500).json({error:"Failed to create employee"})
    }
}

//Delete employeee
//DELETE  /api/employees/:id

export const deleteEmployees = async (req,res) => {
try {
    const {id} = req.params;
    const employee = await Employee.findByIdAndUpdate(
        id,
        { isDeleted: true, employmentStatus: "INACTIVE" },
        { new: true, runValidators: true }
    );
    if(!employee) return res.status(404).json({error:"Employee not found"});
    return res.json({success:true, id: employee._id.toString()});

} catch (error) {
    return res.status(500).json({error:"Failed to delete employee"});
}
}
