import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from "react-hot-toast"
import Attendence from './pages/Attendence'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Layout from './pages/Layout'
import Leave from './pages/Leave'
import Payslips from './pages/Payslips'
import LoginLanding from './pages/LoginLanding'
import PrintPayslips from './pages/PrintPayslip'
import Settings from './pages/Settings'
import LoginForm from './components/LoginForm'





const App = () => {
  return (
   <>
   <Toaster />
   <Routes>
    <Route path='/login' element={<LoginLanding />}  />

    <Route path='/login/admin' element={<LoginForm role="admin" title='Admin portal' subtitle="Sign in to manage the organization"/>} />
    <Route path='/login/employee' element={<LoginForm role="employee" title='Employee Portal' subtitle="Sign in to access your account"/>} />




    <Route element={<Layout/>}  >
    <Route path='/dashboard' element={<Dashboard/>} />
     <Route path='/employees' element={<Employees/>} />
      <Route path='/attendance' element={<Attendence />} />
       <Route path='/leave' element={<Leave/>} />
        <Route path='/payslips' element={<Payslips/>} />
         <Route path='/settings' element={<Settings/>} />
         </Route>
          <Route path='/print/payslips/:id' element={<PrintPayslips />} />
           <Route path='*' element={<Navigate to="/dashboard" replace />} />
   </Routes>
   </>
    
  )
}

export default App
