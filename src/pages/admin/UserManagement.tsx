import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '../../components/Header'
import { Sidebar } from '../../components/Sidebar'
import { authService } from '../../services/authService'
import { masterService } from '../../services/masterService'
import { toast } from 'react-hot-toast'
import type { Campus } from '../../types/master.types'

interface UserRecord {
  id: string
  full_name: string
  email: string
  role: 'ADMIN' | 'MANAGEMENT' | 'OFFICER'
  campus_id: string | null
  status: 'ACTIVE' | 'SUSPENDED'
  campuses?: { name: string } | null
}

export const UserManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [users, setUsers] = useState<UserRecord[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  
  // Provisioning Modal State
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'ADMIN' | 'MANAGEMENT' | 'OFFICER'>('OFFICER')
  const [newCampusId, setNewCampusId] = useState<string>('')
  const [newIdNumber, setNewIdNumber] = useState('')
  const [dobDay, setDobDay] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('')
  const [activeStep, setActiveStep] = useState(1)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [provisionedCreds, setProvisionedCreds] = useState<{ name: string, pass: string } | null>(null)
  const [stats, setStats] = useState([
    { label: 'Total Active Users', value: '...', sub: 'Indexing...', icon: 'how_to_reg', color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Role Distribution', value: '...', sub: 'Pending...', icon: 'groups', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Suspended Staff', value: '...', sub: 'Checking...', icon: 'block', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'System Access', value: 'Live', sub: 'Health OK', icon: 'security', color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [uRes, cRes, curRes] = await Promise.all([
        authService.getUsers(),
        masterService.getCampuses(),
        authService.getCurrentUser()
      ])
      if (uRes.error) throw uRes.error
      if (cRes.error) throw cRes.error
      
      const loggedInId = curRes.profile?.id || null
      setCurrentId(loggedInId)
      
      const allUsers = uRes.data || []
      
      // Compute stats before filtering
      setStats([
        { label: 'Total Active Users', value: String(allUsers.filter(u => u.status === 'ACTIVE').length), sub: 'Currently Authorized', icon: 'how_to_reg', color: 'text-primary', bg: 'bg-primary/5' },
        { label: 'Role Distribution', value: String(allUsers.length), sub: `${allUsers.filter(u => u.role === 'OFFICER').length} Officers • ${allUsers.filter(u => u.role === 'MANAGEMENT').length} Mgmt`, icon: 'groups', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Suspended Staff', value: String(allUsers.filter(u => u.status === 'SUSPENDED').length), sub: 'Access Revoked', icon: 'block', color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'System Access', value: 'Live', sub: 'Authentication Active', icon: 'security', color: 'text-emerald-600', bg: 'bg-emerald-50' }
      ])
      
      // Hide the current user to prevent self-deletion or deactivation
      setUsers(allUsers.filter(u => u.id !== loggedInId))
      setCampuses(cRes.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to synchronize personnel records')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleStatus = async (user: UserRecord) => {
    if (user.id === currentId) {
      toast.error('Identity Conflict: System policy prohibits self-suspension of administrative accounts.')
      setActiveMenu(null)
      return
    }
    const loader = toast.loading('Executing security status update...')
    try {
      const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
      const { error } = await authService.updateUserProfile(user.id, { status: newStatus })
      if (error) throw error
      toast.success(`Access ${newStatus === 'ACTIVE' ? 'Restored' : 'Revoked'}`, { id: loader })
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Access modification protocol failed', { id: loader })
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    if (userToDelete.id === currentId) {
      toast.error('Security Breach Prevented: Users cannot revoke their own root system identity.')
      setUserToDelete(null)
      return
    }
    const loader = toast.loading('Executing secure revocation...')
    try {
      const { error } = await authService.deleteUser(userToDelete.id)
      if (error) throw error
      toast.success('Personnel record purged', { id: loader })
      setUserToDelete(null)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Purge request rejected by system', { id: loader })
    }
  }



  const handleProvision = async () => {
    if (!newName || !newEmail || !newRole || !newIdNumber || !dobDay || !dobMonth || !dobYear) {
      toast.error('Identity Verification: All personnel metadata fields are mandatory.')
      return
    }
    
    // Alphanumeric check for ID Number
    if (!/^[a-zA-Z0-9]+$/.test(newIdNumber)) {
      toast.error('Protocol Violation: ID Number must be alphanumeric only.')
      return
    }
    
    // Format DOB as YYYY-MM-DD
    const dob = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`
    
    setIsProvisioning(true)
    const loader = toast.loading(`Generating credentials for ${newName}...`)
    try {
      const { data, error } = await authService.provisionUser({
        email: newEmail,
        full_name: newName,
        role: newRole,
        campus_id: newCampusId || null,
        id_number: newIdNumber,
        dob
      })
      
      if (error) throw error
      
      // The generated password comes from the Edge Function
      const password = (data as any).generated_password
      
      setProvisionedCreds({ name: newName, pass: password })
      toast.success('Identity Verified & Established', { id: loader })
      
      // Reset form but don't close modal yet
      setNewName('')
      setNewEmail('')
      setNewRole('OFFICER')
      setNewCampusId('')
      setNewIdNumber('')
      setDobDay('')
      setDobMonth('')
      setDobYear('')
      setActiveStep(1)
      fetchData()
    } catch (err: any) {
      console.error('Provisioning protocol failed:', err)
      
      let message = 'Provisioning Protocol Error'
      
      // Attempt to extract the specific error message from the Edge Function body
      if (err instanceof Error && err.message.includes('non-2xx')) {
        try {
           // Supabase sometimes puts the body in err.data or similar
           // But if we throw 'error' from invoke, we need to inspect it
           // Let's just try to be more robust
           if (err.hasOwnProperty('context')) {
              // ... context handling if needed
           }
        } catch (e) {}
      } else if (err.message) {
         message = err.message
      }
      
      toast.error(message, { id: loader })
    } finally {
      setIsProvisioning(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Credentials copied to secure clipboard')
  }

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'Full System Admin'
      case 'MANAGEMENT': return 'Management Analytics'
      case 'OFFICER': return 'Admission Officer'
      default: return role
    }
  }

  return (
    <>
      <Sidebar />
      <main className="md:ml-28 min-h-screen bg-[#F8FAFC]">
        <Header />
        <div className="px-6 md:px-12 pb-12 space-y-12 text-left">
          {/* Management Grade Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200 pb-10"
          >
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 mb-4 font-body">
                <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-sm italic">HR Command Center</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-satoshi font-black text-slate-900 tracking-tighter">User Management</h2>
              <p className="text-slate-500 font-body text-base font-medium max-w-2xl leading-relaxed">
                Control system access and personnel roles. Suspend past employees to protect historical admission data integrity.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-md hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">person_add</span> Provision User
              </button>
            </div>
          </motion.div>

          {/* Professional Minimalist Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-body">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white p-6 rounded-md border border-slate-100 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.02)] flex flex-col items-start group hover:border-primary/20 transition-all duration-500"
              >
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-satoshi font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                    {stat.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Staff Directory Table */}
          <div className="grid grid-cols-1 gap-12 text-left pt-6">
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-1 relative">
              <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg md:text-xl group-hover:text-primary transition-colors">badge</span>
                  <h3 className="font-satoshi text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Personnel Directory</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{loading ? 'Indexing staff...' : `Sync Complete: ${users.length} Records`}</span>
              </div>
              <table className="w-full text-left font-body">
                <thead>
                  <tr className="border-b border-slate-50 bg-white">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Personnel Name</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Email / Identity</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">System Role</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Assigned Region</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Status</th>
                    <th className="px-8 py-6"></th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">No personnel records indexed</p>
                      </td>
                    </tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-7 font-black text-slate-900 uppercase tracking-tight">{u.full_name}</td>
                      <td className="px-8 py-7 font-bold text-slate-500 italic decoration-primary/30 underline-offset-4">{u.email}</td>
                      <td className="px-8 py-7 uppercase tracking-widest text-[9px] font-black">
                         {getRoleLabel(u.role)}
                      </td>
                      <td className="px-8 py-7 font-bold text-slate-600 uppercase tracking-widest text-[10px]">
                        {u.campuses?.name || 'Central Administration'}
                      </td>
                      <td className="px-8 py-7 text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-black/5 ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-amber-50 text-amber-700'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                          {u.status}
                        </div>
                      </td>
                      <td className="px-8 py-7 text-right relative font-body">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                          className="material-symbols-outlined text-slate-300 hover:text-slate-900 transition-colors"
                        >
                          more_horiz
                        </button>

                        <AnimatePresence>
                          {activeMenu === u.id && (
                            <>
                              <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenu(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-8 top-12 z-[70] w-48 bg-white rounded-md shadow-xl border border-slate-100 overflow-hidden text-left py-1"
                              >
                                <button 
                                  onClick={() => {
                                    toggleStatus(u)
                                    setActiveMenu(null)
                                  }}
                                  className={`w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${u.status === 'ACTIVE' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                >
                                  <span className="material-symbols-outlined text-sm">{u.status === 'ACTIVE' ? 'person_off' : 'person_check'}</span>
                                  {u.status === 'ACTIVE' ? 'Suspend Access' : 'Restore Access'}
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button 
                                  onClick={() => {
                                    setUserToDelete(u)
                                    setActiveMenu(null)
                                  }}
                                  className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm text-red-400 font-normal">person_remove</span> Terminate Personnel
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Provision User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-xl bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden text-left"
            >
              <div className="bg-slate-900 px-10 py-12 text-white font-body">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-satoshi font-black tracking-tight leading-none uppercase italic">Provision New Agent</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 tracking-tighter">System Identity Context Creation</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsModalOpen(false)
                      setProvisionedCreds(null)
                    }} 
                    className="material-symbols-outlined text-slate-400 hover:text-white transition-colors"
                  >
                    close
                  </button>
                </div>
              </div>

              <div className="p-10 space-y-10 font-body max-h-[70vh] overflow-y-auto min-h-[400px] flex flex-col">
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {provisionedCreds ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center text-center py-6"
                      >
                         <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8 border border-emerald-100 shadow-inner">
                            <span className="material-symbols-outlined text-[40px]">check_circle</span>
                         </div>
                         <h4 className="text-2xl font-satoshi font-black text-slate-900 mb-2">Identity Established</h4>
                         <p className="text-sm text-slate-500 mb-10 max-w-xs mx-auto">
                            The system has generated unique access credentials for <span className="font-bold text-slate-900">{provisionedCreds.name}</span>.
                         </p>

                         <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-8 space-y-6">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">One-Time Access Password</p>
                               <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
                                  <code className="text-xl font-mono font-black text-primary tracking-widest">{provisionedCreds.pass}</code>
                                  <button 
                                    onClick={() => copyToClipboard(provisionedCreds.pass)}
                                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-all"
                                  >
                                     <span className="material-symbols-outlined text-xl">content_copy</span>
                                  </button>
                               </div>
                            </div>
                            <div className="flex items-start gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 text-left">
                               <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">security</span>
                               <p className="text-[10px] font-bold text-amber-800/70 uppercase tracking-widest leading-normal">
                                  This password is only visible once. Please securely transmit this to the agent immediately.
                               </p>
                            </div>
                         </div>
                      </motion.div>
                    ) : activeStep === 1 ? (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-10"
                      >
                         <div className="space-y-6">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-black">1</div>
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Personnel Core Identity</h4>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Full Name</label>
                              <input 
                                value={newName} onChange={e => setNewName(e.target.value)}
                                className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none transition-all font-black text-slate-900 placeholder:font-medium placeholder:text-slate-300" placeholder="Jessica Pearson" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Official Email</label>
                              <input 
                                type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none transition-all font-black text-slate-900 placeholder:font-medium placeholder:text-slate-300" placeholder="jessica@edumerge.com" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="w-6 h-6 rounded-full border-2 border-slate-200 text-slate-400 text-[10px] flex items-center justify-center font-black">2</div>
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Professional Assignment</h4>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Operational Role</label>
                              <select 
                                value={newRole} onChange={e => setNewRole(e.target.value as any)}
                                className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none transition-all font-black text-slate-700"
                              >
                                <option value="OFFICER">Admission Officer</option>
                                <option value="MANAGEMENT">Executive Management</option>
                                <option value="ADMIN">Root Administrator</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Campus Assignment</label>
                              <select 
                                value={newCampusId} onChange={e => setNewCampusId(e.target.value)}
                                className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none transition-all font-black text-slate-700"
                              >
                                <option value="">Central Admin (All regions)</option>
                                {campuses.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10"
                      >
                         <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-black"><span className="material-symbols-outlined text-[12px]">check</span></div>
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Core Identity Verified</h4>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                               <div>
                                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{newName}</p>
                                  <p className="text-[9px] font-bold text-slate-400 italic">{newEmail}</p>
                               </div>
                               <div className="text-right">
                                  <span className="px-2 py-0.5 bg-slate-200 rounded-sm text-[8px] font-black uppercase tracking-widest text-slate-600">{newRole}</span>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-black">2</div>
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Security & Credentials</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                             <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Personnel ID #</label>
                               <input 
                                 value={newIdNumber} onChange={e => setNewIdNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                                 className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none transition-all font-black text-slate-900 placeholder:text-slate-300" placeholder="e.g. EMP001" 
                               />
                             </div>
                             <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Birth Date Mapping</label>
                               <div className="flex gap-2">
                                 <input 
                                   type="number" value={dobDay} onChange={e => setDobDay(e.target.value)}
                                   className="w-16 px-2 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-center font-black text-slate-900" placeholder="DD" 
                                 />
                                 <select 
                                   value={dobMonth} onChange={e => setDobMonth(e.target.value)}
                                   className="flex-1 px-2 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-black text-slate-700 text-xs"
                                 >
                                   <option value="">Month</option>
                                   {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                     <option key={m} value={String(m).padStart(2, '0')}>{new Date(0, m-1).toLocaleString('default', {month: 'short'})}</option>
                                   ))}
                                 </select>
                                 <input 
                                   type="number" value={dobYear} onChange={e => setDobYear(e.target.value)}
                                   className="w-24 px-2 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-center font-black text-slate-900" placeholder="YYYY" 
                                 />
                               </div>
                             </div>
                           </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-4 pt-10 border-t border-slate-100">
                  {provisionedCreds ? (
                    <button 
                      onClick={() => {
                        setIsModalOpen(false)
                        setProvisionedCreds(null)
                      }} 
                      className="w-full px-4 py-5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] font-black shadow-xl shadow-slate-900/20"
                    >
                      Process Complete
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                            if (activeStep === 2) setActiveStep(1)
                            else setIsModalOpen(false)
                        }} 
                        className="flex-1 px-4 py-5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all font-black"
                      >
                        {activeStep === 2 ? 'Back' : 'Cancel'}
                      </button>
                      <button 
                        onClick={() => {
                            if (activeStep === 1) {
                                if (!newName || !newEmail) {
                                    toast.error('Personnel verification required.')
                                    return
                                }
                                setActiveStep(2)
                            } else {
                                handleProvision()
                            }
                        }}
                        disabled={isProvisioning}
                        className="flex-[1.5] px-4 py-5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                      >
                        {isProvisioning ? 'Working...' : (activeStep === 1 ? 'Continue to Security' : 'Establish Profile')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Secure Delete Confirmation */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserToDelete(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[8px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-[0px_40px_80px_rgba(0,0,0,0.1)] border border-slate-200 p-8 text-center"
            >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
                    <span className="material-symbols-outlined text-[32px] animate-pulse">person_remove</span>
                </div>
                
                <h3 className="text-2xl font-satoshi font-black text-blue-950 tracking-tight italic">Revoke Access</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/60 mt-1 mb-6">Security Protocol Action</p>
                
                <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed px-4 font-body">
                    Deleting <span className="font-bold text-slate-900 underline decoration-red-200">"{userToDelete.full_name}"</span> will immediately terminate all active sessions and block system entry.
                </p>

                <div className="bg-rose-50/50 p-4 rounded-xl border border-red-100/50 text-left mb-8 font-body">
                     <div className="flex gap-2">
                        <span className="material-symbols-outlined text-red-500 text-sm">security</span>
                        <p className="text-[10px] font-bold text-red-800/70 uppercase tracking-widest leading-normal italic">
                            All personnel logs and historical activities will be locked post-revocation.
                        </p>
                     </div>
                </div>

                <div className="flex flex-col gap-3 font-body">
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDelete}
                        className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-red-200 hover:bg-red-700 transition-colors"
                    >
                        Confirm Revocation
                    </motion.button>
                    <button 
                        onClick={() => setUserToDelete(null)}
                        className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                        Abort Protocol
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
