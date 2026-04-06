import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '../../components/Header'
import { Sidebar } from '../../components/Sidebar'
import { masterService } from '../../services/masterService'
import { rulebookService } from '../../services/rulebookService'
import { authService } from '../../services/authService'
import { toast } from 'react-hot-toast'
import type { Institution as InstitutionRecord, Campus } from '../../types/master.types'

export const Institution = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'institution' | 'campus'>('campus')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Data State
  const [institutions, setInstitutions] = useState<InstitutionRecord[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [stats, setStats] = useState([
    { label: 'University Scale', value: '0', sub: 'Registered Campuses', icon: 'home_work', color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Total Departments', value: '-', sub: 'Academic Schools', icon: 'account_tree', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Registered Staff', value: '-', sub: 'Authorized Access', icon: 'person_shield', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Admissions Year', value: '...', sub: 'Setup Phase', icon: 'verified', color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ])

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    affiliated_university: '',
    operational_tier: 'Tier 1 - Master Operational',
    contact_email: '',
    contact_number: '',
    physical_address: '',
    institution_id: ''
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [instRes, campRes, yearRes, deptRes, userRes] = await Promise.all([
        masterService.getInstitutions(false),
        masterService.getCampuses(undefined, false),
        rulebookService.getActiveAcademicYear(),
        masterService.getDepartments(false),
        authService.getUsers()
      ])

      const instData = instRes.data || []
      const campData = campRes.data || []
      const yearData = yearRes.data
      const deptData = deptRes.data || []
      const userData = userRes.data || []

      setInstitutions(instData)
      setCampuses(campData)

      setStats([
        { 
          label: 'University Scale', 
          value: (instData.length + campData.length).toString(), 
          sub: 'Registered Campuses', 
          icon: 'home_work', 
          color: 'text-primary', 
          bg: 'bg-primary/5' 
        },
        { 
          label: 'Total Departments', 
          value: deptData.length.toString(), 
          sub: 'Academic Schools', 
          icon: 'account_tree', 
          color: 'text-blue-600', 
          bg: 'bg-blue-50' 
        },
        { 
          label: 'Registered Staff', 
          value: userData.length.toString(), 
          sub: 'Authorized Access', 
          icon: 'person_shield', 
          color: 'text-purple-600', 
          bg: 'bg-purple-50' 
        },
        { 
          label: 'Admissions Year', 
          value: yearData?.year_string || 'Pending', 
          sub: yearData?.is_active ? 'Live Enrollment' : 'Setup Phase', 
          icon: 'verified', 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-50' 
        }
      ])

      // Auto-select first institution for campus creation
      if (instData.length > 0) {
        setFormData(prev => ({ ...prev, institution_id: instData[0].id }))
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to synchronize operational architecture')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openModal = (type: 'institution' | 'campus', data?: any) => {
    setModalType(type)
    if (data) {
      setEditingId(data.id)
      setFormData({
        name: data.name || '',
        code: data.code || '',
        affiliated_university: data.affiliated_university || '',
        operational_tier: data.operational_tier || 'Tier 1 - Master Operational',
        contact_email: data.contact_email || '',
        contact_number: data.contact_number || '',
        physical_address: data.physical_address || '',
        institution_id: data.institution_id || (institutions[0]?.id || '')
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '',
        code: '',
        affiliated_university: '',
        operational_tier: 'Tier 1 - Master Operational',
        contact_email: '',
        contact_number: '',
        physical_address: '',
        institution_id: institutions[0]?.id || ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    const loadingToast = toast.loading(editingId ? 'Updating records...' : 'Provisions syncing...')
    try {
      if (modalType === 'institution') {
        const payload = {
          name: formData.name,
          code: formData.code,
          affiliated_university: formData.affiliated_university,
          operational_tier: formData.operational_tier,
          contact_email: formData.contact_email,
          contact_number: formData.contact_number,
          physical_address: formData.physical_address
        }
        
        const { error } = editingId 
          ? await masterService.updateInstitution(editingId, payload)
          : await masterService.createInstitution(payload)
        
        if (error) throw error
        toast.success(editingId ? 'University profile updated' : 'Institutional hierarchy updated', { id: loadingToast })
      } else {
        const payload = {
          name: formData.name,
          code: formData.code,
          operational_tier: formData.operational_tier,
          contact_email: formData.contact_email,
          contact_number: formData.contact_number,
          physical_address: formData.physical_address,
          institution_id: formData.institution_id
        }

        const { error } = editingId
          ? await masterService.updateCampus(editingId, payload)
          : await masterService.createCampus(payload)

        if (error) throw error
        toast.success(editingId ? 'Campus details updated' : 'Campus unit deployed successfully', { id: loadingToast })
      }
      setIsModalOpen(false)
      setEditingId(null)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Submission rejected by gateway', { id: loadingToast })
    }
  }

  return (
    <>
      <Sidebar />
      <main className="md:ml-28 min-h-screen bg-[#F8FAFC]">
        <Header />
        <div className="px-6 md:px-12 pb-12 space-y-12">
          {/* Management Grade Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200 pb-10"
          >
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-sm">Master Admin Control</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-satoshi font-black text-slate-900 tracking-tighter uppercase">UNIVERSITY & CAMPUS</h2>
              <p className="text-slate-500 font-body text-base font-medium max-w-2xl leading-relaxed italic">Management center for your university profile and physical campus locations.</p>
            </div>
            <div className="flex gap-4">
              <button
                disabled={loading}
                onClick={() => openModal('institution')}
                className="bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 ring-1 ring-black/5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">tune</span> UNIVERSITY PROFILE
              </button>
              <button
                disabled={loading || institutions.length === 0}
                onClick={() => openModal('campus')}
                className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-md hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20 disabled:grayscale disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">add_box</span> NEW CAMPUS
              </button>
            </div>
          </motion.div>

          {/* Professional Minimalist Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-satoshi font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-1 flex items-center gap-2 text-left">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                    {stat.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Data Sheets */}
          <div className="grid grid-cols-1 gap-12 text-left pt-6">
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-1 min-h-[400px]">
              <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg">analytics</span>
                  <h3 className="font-satoshi text-xs font-black text-slate-900 uppercase tracking-[0.2em]">University & Location Registry</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {loading ? 'Synchronizing Pipeline...' : 'Last Synced: Just now'}
                </span>
              </div>
              <table className="w-full text-left font-body">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Classification</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Unit Name</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">System Code</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Lifecycle Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-24">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Decrypting Operational Units...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Institutions Section */}
                      {institutions.map((item) => (
                        <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-7">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-900 text-white italic">MAIN HQ</span>
                          </td>
                          <td className="px-8 py-7 font-black text-slate-900 uppercase tracking-tight">{item.name}</td>
                          <td className="px-8 py-7 font-mono font-bold text-slate-400 uppercase">{item.code}</td>
                          <td className="px-8 py-7">
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'} text-[10px] font-black uppercase tracking-widest ring-1 ring-black/5`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-300'} ${item.is_active ? 'animate-pulse' : ''}`}></div>
                              {item.is_active ? 'Master Active' : 'Suspended'}
                            </div>
                          </td>
                          <td className="px-8 py-7 text-center">
                            <button 
                              onClick={() => openModal('institution', item)}
                              className="material-symbols-outlined text-slate-300 hover:text-primary transition-all p-2 rounded-xl hover:bg-primary/5 active:scale-90"
                            >
                              edit_square
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Campuses Section */}
                      {campuses.map((item) => (
                        <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-7">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 text-slate-500">Unit</span>
                          </td>
                          <td className="px-8 py-7 font-black text-slate-900 uppercase tracking-tight">{item.name}</td>
                          <td className="px-8 py-7 font-mono font-bold text-slate-400 uppercase">{item.code}</td>
                          <td className="px-8 py-7">
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${item.is_active ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'} text-[10px] font-black uppercase tracking-widest ring-1 ring-black/5`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-blue-500' : 'bg-slate-300'} ${item.is_active ? 'animate-pulse' : ''}`}></div>
                              {item.is_active ? 'Operational' : 'Maintenance'}
                            </div>
                          </td>
                          <td className="px-8 py-7 text-center">
                            <button 
                              onClick={() => openModal('campus', item)}
                              className="material-symbols-outlined text-slate-300 hover:text-primary transition-all p-2 rounded-xl hover:bg-primary/5 active:scale-90"
                            >
                              edit_square
                            </button>
                          </td>
                        </tr>
                      ))}
                      {institutions.length === 0 && campuses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-20 text-center font-black text-slate-300 uppercase tracking-widest text-[10px]">No operational units found in current cycle</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Management Grade Modal */}
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
              <div className="bg-slate-900 px-10 py-12 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-satoshi font-black tracking-tight leading-none uppercase italic">
                      {editingId 
                        ? (modalType === 'institution' ? 'Update University' : 'Update Campus') 
                        : (modalType === 'institution' ? 'Configure Profile' : 'New Campus Unit')}
                    </h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">University Management Registry</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">close</button>
                </div>
              </div>

              <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar font-body">
                {modalType === 'campus' && institutions.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Parent Institution</label>
                    <select 
                      value={formData.institution_id}
                      onChange={(e) => setFormData({...formData, institution_id: e.target.value})}
                      className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-700"
                    >
                      {institutions.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">
                    {modalType === 'institution' ? 'University Name' : 'Campus Name'}
                  </label>
                  <input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900 placeholder:font-medium placeholder:text-slate-300" 
                    placeholder="e.g., EduMerge University" 
                  />
                </div>

                {modalType === 'institution' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Affiliated University</label>
                    <input 
                      value={formData.affiliated_university}
                      onChange={(e) => setFormData({...formData, affiliated_university: e.target.value})}
                      className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900 placeholder:text-slate-300" 
                      placeholder="e.g., Visvesvaraya Technological University" 
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">
                      {modalType === 'institution' ? 'Official Code' : 'Campus Code'}
                    </label>
                    <input 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono font-bold text-slate-900 placeholder:text-slate-300 uppercase" 
                      placeholder="e.g., EDU-001" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Operational Tier</label>
                    <select 
                      value={formData.operational_tier}
                      onChange={(e) => setFormData({...formData, operational_tier: e.target.value})}
                      className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-700"
                    >
                      <option value="Tier 1 - Master Operational">Tier 1 - Master Operational</option>
                      <option value="Tier 2 - Satellite Campus">Tier 2 - Satellite Campus</option>
                      <option value="Legacy Maintenance">Legacy Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Official Contact Email</label>
                    <input 
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900 placeholder:text-slate-300" 
                      placeholder="e.g., admin@edumerge.edu" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Official Contact Number</label>
                    <input 
                      value={formData.contact_number}
                      onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                      type="tel" 
                      className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900 placeholder:text-slate-300" 
                      placeholder="+91 98765 43210" 
                    />
                  </div>
                </div>

                <div className="space-y-2 pb-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Registered Physical Address</label>
                  <textarea 
                    value={formData.physical_address}
                    onChange={(e) => setFormData({...formData, physical_address: e.target.value})}
                    rows={3} 
                    className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900 placeholder:text-slate-300 resize-none" 
                    placeholder="123 Education Lane, Tech City, Bangalore, Karnataka - 560001"
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-8 border-t border-slate-100">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">Abort</button>
                  <button 
                    onClick={handleSave}
                    className="flex-[1.5] px-4 py-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-slate-900/40"
                  >
                    {editingId ? 'Save Changes' : (modalType === 'institution' ? 'Create Profile' : 'Add Campus')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
