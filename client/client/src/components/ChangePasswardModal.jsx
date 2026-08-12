import { Loader2Icon, LockIcon, X } from 'lucide-react'
import React, { useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ChangePasswardModal = ({open,onClose}) => {

    const [loading,setLoading] = useState(false)
    const [message,setMessage] = useState({type :"",text:""})
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })
        try {
            const formData = new FormData(e.currentTarget)
            if (formData.get('newPassword') !== formData.get('confirmPassword')) {
                setMessage({ type: 'error', text: 'New passwords do not match' })
                return
            }
            await api.post('/auth/change-password', {
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword'),
            })
            setMessage({ type: 'success', text: 'Password updated successfully' })
            toast.success('Password updated successfully')
            e.currentTarget.reset()
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update password' })
        } finally {
            setLoading(false)
        }
    }
    if(!open) return null


  return (
    <div onClick={onClose} className='fixed inset-0 z-50 flex items-center justify-center p-4'> 
      <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' />
      <div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in' onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-between p-6 pb-0'>
            <h2 className='text-lg font-medium text-slate-900 flex items-center gap-2'>  <LockIcon className='w-5 h-5 text-slate-400' /> change Passward</h2>
            <button onClick={onClose} className='p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600'>
            <X className='w-5 h-5'/></button>
        </div>
        
        <form className='p-6 space-y-5 ' onSubmit={handleSubmit}>
            {message.text && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-3 ${message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200 " : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${message.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {message.text}
                </div>
            )}
            <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>Current Password</label>
                <input type="password" name='currentPassword' required />
            </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>New password</label>
                <input type="password" name='newPassword' minLength="6" required />
            </div>
            <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>Confirm new password</label>
                <input type="password" name='confirmPassword' minLength="6" required />
            </div>
            <div className='flex gap-3 pt-2'>
                <button type='button' onClick={onClose} className='btn-secondary flex-1'>
                    Cancel
                </button>
                   <button type='submit'disabled={loading} className='btn-primary flex flex-1 justify-center items-center gap-2'>
                    {loading && <Loader2Icon className='w-4 h-4 animate-spin' />}
                   Update password
                </button>
            </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswardModal
