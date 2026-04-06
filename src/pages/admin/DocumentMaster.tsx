import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '../../components/Header'
import { Sidebar } from '../../components/Sidebar'
import { rulebookService } from '../../services/rulebookService'
import { toast } from 'react-hot-toast'
import type { DocumentMaster as MasterDocRecord } from '../../types/rulebook.types'

export const DocumentMaster = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [editingDoc, setEditingDoc] = useState<MasterDocRecord | null>(null)
  const [docToDelete, setDocToDelete] = useState<MasterDocRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<MasterDocRecord[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    is_mandatory: true,
    course_level_req: 'All Levels' as 'All Levels' | 'UG Only' | 'PG Only',
    quota_req: 'All Quotas' as 'All Quotas' | 'Government Only' | 'Management Only'
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await rulebookService.getDocumentMasters(false)
      if (error) throw error
      setDocuments(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to synchronize compliance checklist')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (editingDoc) {
      setFormData({
        name: editingDoc.name,
        is_mandatory: editingDoc.is_mandatory,
        course_level_req: editingDoc.course_level_req as 'All Levels' | 'UG Only' | 'PG Only',
        quota_req: editingDoc.quota_req as 'All Quotas' | 'Government Only' | 'Management Only'
      })
    } else {
      setFormData({
        name: '',
        is_mandatory: true,
        course_level_req: 'All Levels',
        quota_req: 'All Quotas'
      })
    }
  }, [editingDoc])

  const handleSave = async () => {
    if (!formData.name) return toast.error('Document name is required protocol')
    const loader = toast.loading(editingDoc ? 'Committing modifications...' : 'Deploying to master registry...')
    try {
      if (editingDoc) {
        const { error } = await rulebookService.updateDocumentMaster(editingDoc.id, formData)
        if (error) throw error
        toast.success('Configuration updated successfully', { id: loader })
      } else {
        const { error } = await rulebookService.createDocumentMaster({
          ...formData,
          is_active: true
        })
        if (error) throw error
        toast.success('New requirement deployed', { id: loader })
      }
      setIsModalOpen(false)
      setEditingDoc(null)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Registry update failed', { id: loader })
    }
  }

  const toggleStatus = async (doc: MasterDocRecord) => {
    const loader = toast.loading('Toggling operational status...')
    try {
      const { error } = await rulebookService.updateDocumentMaster(doc.id, { is_active: !doc.is_active })
      if (error) throw error
      toast.success(`Requirement ${!doc.is_active ? 'Activated' : 'Archived'}`, { id: loader })
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Status toggle failed', { id: loader })
    }
  }

  const handleDelete = async () => {
    if (!docToDelete) return
    const loader = toast.loading('Executing secure deletion...')
    try {
      const { error } = await rulebookService.deleteDocumentMaster(docToDelete.id)
      if (error) throw error
      toast.success('Purged from registry', { id: loader })
      setDocToDelete(null)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Deletion protocol failed', { id: loader })
    }
  }

  const stats = [
    { label: 'Total Documents', value: String(documents.length), sub: 'Master Checklist Size', icon: 'topic', color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Mandatory Files', value: String(documents.filter(d => d.is_mandatory).length), sub: 'Compulsory Requirements', icon: 'gpp_maybe', color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Archived Records', value: String(documents.filter(d => !d.is_active).length), sub: 'Disabled Requirements', icon: 'archive', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Registry Status', value: 'Live', sub: 'Synced to Admissions', icon: 'link', color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ]

  const getLevelPill = (level: string) => {
    switch(level) {
      case 'PG Only': return <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-purple-100">Post Grad</span>
      case 'UG Only': return <span className="bg-sky-50 text-sky-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-sky-100">Under Grad</span>
      default: return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest leading-none">Universal</span>
    }
  }

  const getQuotaPill = (quota: string) => {
    switch(quota) {
      case 'Government Only': return <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">Govt Quota</span>
      case 'Management Only': return <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-amber-100">Management</span>
      default: return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest leading-none">All Quotas</span>
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
                <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-sm italic">Compliance Control</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-satoshi font-black text-slate-900 tracking-tighter">Document Checklist Master</h2>
              <p className="text-slate-500 font-body text-base font-medium max-w-2xl leading-relaxed">
                The absolute shopping list for admission paperwork. Define which documents are mandatory based on course level and admission quota.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-md hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">post_add</span> Add New Requirement
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

          {/* Document Registry Table */}
          <div className="grid grid-cols-1 gap-12 text-left pt-6">
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-1 relative">
              <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg">fact_check</span>
                  <h3 className="font-satoshi text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Master Checklist Registry</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{loading ? 'Syncing...' : `Total: ${documents.length}`}</span>
              </div>
              <table className="w-full text-left font-body">
                <thead>
                  <tr className="border-b border-slate-50 bg-white">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Document Name</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Mandatory?</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Target Level</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Target Quota</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Status</th>
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
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">No compliance requirements configured</p>
                      </td>
                    </tr>
                  ) : documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-7 font-black text-slate-900 flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-300 text-xl group-hover:text-primary transition-colors">description</span>
                        {doc.name}
                      </td>
                      <td className="px-8 py-7 text-center">
                        {doc.is_mandatory ? (
                           <span className="material-symbols-outlined text-red-500 scale-125" title="Required for Admission">gpp_maybe</span>
                        ) : (
                           <span className="material-symbols-outlined text-slate-300" title="Optional File">remove</span>
                        )}
                      </td>
                      <td className="px-8 py-7">{getLevelPill(doc.course_level_req)}</td>
                      <td className="px-8 py-7">{getQuotaPill(doc.quota_req)}</td>
                      <td className="px-8 py-7">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-black/5 ${doc.is_active ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-50 text-slate-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${doc.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                          {doc.is_active ? 'ACTIVE' : 'ARCHIVED'}
                        </div>
                      </td>
                      <td className="px-8 py-7 text-right relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                          className="material-symbols-outlined text-slate-300 hover:text-slate-900 transition-colors"
                        >
                          more_horiz
                        </button>
                        
                        <AnimatePresence>
                          {activeMenu === doc.id && (
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
                                    setEditingDoc(doc)
                                    setActiveMenu(null)
                                  }}
                                  className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span> Edit Config
                                </button>
                                <button 
                                  onClick={() => {
                                    toggleStatus(doc)
                                    setActiveMenu(null)
                                  }}
                                  className={`w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${doc.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                >
                                  <span className="material-symbols-outlined text-sm">{doc.is_active ? 'archive' : 'unarchive'}</span>
                                  {doc.is_active ? 'Archive Req' : 'Active Req'}
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button 
                                  onClick={() => {
                                    setDocToDelete(doc)
                                    setActiveMenu(null)
                                  }}
                                  className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm text-red-400 font-normal">delete</span> Hard Delete
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

      {/* Add/Edit Document Modal */}
      <AnimatePresence>
        {(isModalOpen || editingDoc) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false)
                setEditingDoc(null)
              }}
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
                    <h3 className="text-2xl font-satoshi font-black tracking-tight leading-none uppercase italic">
                      {editingDoc ? 'Update Configuration' : 'Configure Document'}
                    </h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Compliance Checklist Master</p>
                  </div>
                  <button onClick={() => {
                    setIsModalOpen(false)
                    setEditingDoc(null)
                  }} className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">close</button>
                </div>
              </div>

              <div className="p-10 space-y-6 font-body">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Document Profile Name</label>
                  <input 
                    value={formData.name} 
                    onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
                    className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900 placeholder:font-medium placeholder:text-slate-300" placeholder="e.g., Transfer Certificate (TC)" />
                </div>
                
                <div className="space-y-2 pt-2">
                   <div className="flex h-[60px] items-center px-5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                      <label className="flex items-center gap-4 w-full cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={formData.is_mandatory} 
                           onChange={e => setFormData(prev => ({...prev, is_mandatory: e.target.checked}))}
                           className="w-4 h-4 accent-red-600 rounded" />
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Mandatory for Admission Confirmation</span>
                         </div>
                         <span className="material-symbols-outlined ml-auto text-red-500">gpp_maybe</span>
                      </label>
                   </div>
                   <p className="text-[10px] text-slate-400 font-medium ml-1 italic">If checked, Officers cannot confirm an admission without verifying this file.</p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Course Level Requirement</label>
                    <select 
                      value={formData.course_level_req} 
                      onChange={e => setFormData(prev => ({...prev, course_level_req: e.target.value as 'All Levels' | 'UG Only' | 'PG Only'}))}
                      className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-700"
                    >
                      <option value="All Levels">Apply to: Universal</option>
                      <option value="UG Only">Apply to: UG Programs</option>
                      <option value="PG Only">Apply to: PG Programs</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Quota Requirement</label>
                    <select 
                      value={formData.quota_req} 
                      onChange={e => setFormData(prev => ({...prev, quota_req: e.target.value as 'All Quotas' | 'Government Only' | 'Management Only'}))}
                      className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-700"
                    >
                      <option value="All Quotas">Apply to: All Quotas</option>
                      <option value="Government Only">Government Only</option>
                      <option value="Management Only">Management Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-8 border-t border-slate-100">
                  <button onClick={() => {
                    setIsModalOpen(false)
                    setEditingDoc(null)
                  }} className="flex-1 px-4 py-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">Cancel</button>
                  <button 
                    onClick={handleSave}
                    className="flex-[1.5] px-4 py-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                  >
                    {editingDoc ? 'Save Modifications' : 'Deploy to Registry'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Secure Delete Confirmation */}
      <AnimatePresence>
        {docToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDocToDelete(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[8px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-[0px_40px_80px_rgba(0,0,0,0.1)] border border-slate-200 p-8 text-center"
            >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
                    <span className="material-symbols-outlined text-[32px] animate-pulse">delete_forever</span>
                </div>
                
                <h3 className="text-2xl font-satoshi font-black text-blue-950 italic">Secure Deletion</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/60 mt-1 mb-6">Master Registry Action</p>
                
                <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed font-body">
                    You are permanently removing <span className="font-bold text-slate-900 underline underline-offset-4 decoration-red-200">"{docToDelete.name}"</span>. This action cannot be reversed within the master checklist.
                </p>

                <div className="bg-rose-50/50 p-4 rounded-xl border border-red-100/50 text-left mb-8 font-body">
                     <div className="flex gap-2">
                        <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
                        <p className="text-[10px] font-bold text-red-800/70 uppercase tracking-widest leading-normal italic">
                            Requirement will be stripped from all active admission pipelines immediately.
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
                        Confirm Hard Delete
                    </motion.button>
                    <button 
                        onClick={() => setDocToDelete(null)}
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
