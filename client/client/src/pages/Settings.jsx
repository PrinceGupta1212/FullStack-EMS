import React, { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import { Lock  } from 'lucide-react'
import ProfileForm from '../components/ProfileForm'
import ChangePasswardModal from '../components/ChangePasswardModal'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Settings = () => {

  const [profile,setProfile] = useState(null)
  const [loading,setLoading] = useState(true)
  const [showPasswordModal,setShowPasswordModal] = useState(false)
  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/profile')
      setProfile(data)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  },[])

  if(loading) return <Loading />


  return (
    <div className='animate-fade-in'>
      <div className='page-header'>
        <h1 className='page-title'>Settings</h1>
        <p className='page-subtitle'>manage your account and preferences</p>
      </div>

      {profile && <ProfileForm initialData={profile} onSuccess={fetchProfile}/>}
      {/*change passward trigger */}
      <div className='card max-w-md p-6 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='p-2.5 bg-slate-100 rounded-lg'>
            <Lock className='w-5 h-5 text-slate-600' />
          </div>
          <div>
            <p className='font-medium text-slate-900'>Password</p>
            <p className='text-sm text-slate-500'>Update your account passward</p>
          </div>
        </div>
        <button onClick={()=> setShowPasswordModal(true)} className='btn-secondary text-sm'>
          Change
          </button> 

      </div>
      <ChangePasswardModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  )
}

export default Settings

