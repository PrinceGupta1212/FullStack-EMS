import React, { useCallback, useEffect, useState } from 'react'
import Loading from '../components/Loading';
import PaySlipList from '../components/payslip/PaySlipList';
import GeneratePayslipForm from '../components/payslip/GeneratePayslipForm';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Payslips = () => {

  const [payslips,setPayslips] = useState([])
  const [employees,setEmployees] = useState([])
  const [loading,setLoading] = useState(true);

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const fetchPayslips = useCallback(async() => {
    try {
      const { data } = await api.get('/payslips')
      setPayslips(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load payslips')
    } finally {
      setLoading(false)
    }
  },[])


  useEffect(() => {
    fetchPayslips()
  },[fetchPayslips])

   useEffect(() => {
    if (!isAdmin) return
    api.get('/employees')
      .then(({ data }) => setEmployees(Array.isArray(data) ? data : []))
      .catch((error) => toast.error(error.response?.data?.error || 'Failed to load employees'))
  },[isAdmin])

if(loading) return <Loading />

  return (
    <div className='animate-fade-in'>
     <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
      <div>
        <h1 className='page-title'>Payslips</h1>
        <p className='page-subtitle'>{isAdmin ? "generate and manage employees payslips" : "your payslips history"}</p>
      </div>
      {isAdmin && <GeneratePayslipForm employees={employees} onSuccess={fetchPayslips}/>}
     </div>
     <PaySlipList payslips={Array.isArray(payslips) ? payslips : []} isAdmin={isAdmin}/>
    </div>
  )
}

export default Payslips
