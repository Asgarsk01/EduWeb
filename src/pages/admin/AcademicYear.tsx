import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '../../components/Header'
import { Sidebar } from '../../components/Sidebar'
import { rulebookService } from '../../services/rulebookService'
import { toast } from 'react-hot-toast'
import type { AcademicYear as YearRecord } from '../../types/rulebook.types'

export const AcademicYear = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState<YearRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [cycles, setCycles] = useState<YearRecord[]>([])
  
  const [formData, setFormData] = useState({
    year_string: '',
    is_active: false
  })

  const [stats, setStats] = useState([
    { label: 'Primary Active Cycle', value: '...', sub: 'Initializing...', icon: 'verified', color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Historical Records', value: '0', sub: 'Since inception', icon: 'layers', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Registry Status', value: 'Live', sub: 'Accepting Data', icon: 'hub', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Last Sync Date', value: '-', sub: 'Internal Record', icon: 'event_available', color: 'text-purple-600', bg: 'bg-purple-50' }
  ])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await rulebookService.getAcademicYears()
      if (error) throw error
      
      const records = data || []
      setCycles(records)
      
      const active = records.find(r => r.is_active)
      
      setStats([
        { 
          label: 'Primary Active Cycle', 
          value: active?.year_string || 'None', 
          sub: active ? 'Admissions Live' : 'Cycle Pending', 
          icon: 'verified', 
          color: 'text-primary', 
          bg: 'bg-primary/5' 
        },
        { 
          label: 'Historical Records', 
          value: records.length.toString(), 
          sub: `Archive Size: ${records.filter(r => !r.is_active).length} years`, 
          icon: 'layers', 
          color: 'text-blue-600', 
          bg: 'bg-blue-50' 
        },
        { 
          label: 'Registry Status', 
          value: 'Live', 
          sub: 'Operational Gateway', 
          icon: 'hub', 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-50' 
        },
        { 
          label: 'Last Sync Date', 
          value: records[0] ? new Date(records[0].created_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-', 
          sub: 'Internal Sync', 
          icon: 'event_available', 
          color: 'text-purple-600', 
          bg: 'bg-purple-50' 
        }
      ])
    } catch (err) {
      console.error(err)
      toast.error('Failed to synchronize temporal cycles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleActivateClick = (cycle: YearRecord) => {
    if (cycle.is_active) return
    setSelectedCycle(cycle)
    setIsConfirmOpen(true)
  }

  const confirmActivation = async () => {
    if (!selectedCycle) return
    const loader = toast.loading(`Propagating ${selectedCycle.year_string} cycle...`)
    try {
      const { error } = await rulebookService.activateAcademicYear(selectedCycle.id)
      if (error) throw error
      toast.success('System cycle re-aligned', { id: loader })
      setIsConfirmOpen(false)
      setSelectedCycle(null)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Cycle propagation rejected', { id: loader })
    }
  }

  const handleInitialize = async () => {
    const loader = toast.loading('Initializing temporal block...')
    try {
      const { error } = await rulebookService.createAcademicYear(formData)
      if (error) throw error
      toast.success('New academic year deployed', { id: loader })
      setIsModalOpen(false)
      setFormData({ year_string: '', is_active: false })
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Initialization protocol failed', { id: loader })
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
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-sm">Cycle Management</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-satoshi font-black text-slate-900 tracking-tighter">Academic Year</h2>
              <p className="text-slate-500 font-body text-base font-medium max-w-2xl leading-relaxed">
                System-wide academic cycle control. Only one year can be active at a time. Archiving a year freezes all associated admission data.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-md hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">edit_calendar</span> Initialize New Cycle
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

          {/* Academic Cycle List */}
          <div className="grid grid-cols-1 gap-12 text-left pt-6">
            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden p-1">
              <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg">layers</span>
                  <h3 className="font-satoshi text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Academic Cycle Records</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {loading ? 'Decrypting Timeline...' : `Total Blocks: ${cycles.length}`}
                </span>
              </div>
              <table className="w-full text-left font-body">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Temporal Block Identity</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Creation Date</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Cycle Status</th>
                    <th className="px-10 py-6"></th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto opacity-40"></div>
                      </td>
                    </tr>
                  ) : (
                    cycles.map((cycle) => (
                      <tr key={cycle.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/20 transition-colors group">
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-4 text-left">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cycle.is_active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400'}`}>
                                <span className="material-symbols-outlined text-lg">calendar_month</span>
                            </div>
                            <span className="font-black text-slate-900 uppercase tracking-tight">{cycle.year_string}</span>
                          </div>
                        </td>
                        <td className="px-10 py-7 font-bold text-slate-400 lowercase italic">
                          Created {new Date(cycle.created_at!).toLocaleDateString()}
                        </td>
                        <td className="px-10 py-7">
                          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-black/5 ${cycle.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${cycle.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                            {cycle.is_active ? 'Master Active' : 'Archived'}
                          </div>
                        </td>
                        <td className="px-10 py-7 text-right">
                          {!cycle.is_active ? (
                            <button 
                              onClick={() => handleActivateClick(cycle)}
                              className="text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-4 py-2 rounded-md border border-primary/20 transition-all font-body active:scale-95"
                            >
                              Sync System
                            </button>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 pointer-events-none italic font-body">Current Primary</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Initialize Modal */}
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
                    <h3 className="text-2xl font-satoshi font-black tracking-tight leading-none uppercase">Initialize Cycle</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Temporal Architecture Provisioning</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">close</button>
                </div>
              </div>

              <div className="p-10 space-y-8 font-body text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Display Label / Identification</label>
                  <input 
                    value={formData.year_string}
                    onChange={(e) => setFormData({...formData, year_string: e.target.value})}
                    className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900 uppercase" 
                    placeholder="e.g., 2026-27" 
                  />
                </div>

                <div className="space-y-2 pb-4">
                   <label className="flex h-[58px] items-center px-5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer group hover:bg-slate-50 transition-all">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-primary" 
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-3">Set as Active Node Immediately</span>
                      <span className="material-symbols-outlined text-amber-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">warning</span>
                   </label>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mt-3 flex items-center gap-2">
                     <span className="material-symbols-outlined text-xs">info</span>
                     Warning: Setting this will archive all other cycles instantly.
                   </p>
                </div>

                <div className="flex gap-4 pt-8 border-t border-slate-100">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">Cancel</button>
                  <button 
                    onClick={handleInitialize}
                    className="flex-[1.5] px-4 py-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-slate-900/40"
                  >
                    Initialize System Cycle
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Warning Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && selectedCycle && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-950/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-md shadow-2xl border border-red-100 overflow-hidden text-center p-12"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="material-symbols-outlined text-4xl">warning</span>
              </div>
              <h3 className="text-xl font-satoshi font-black text-slate-900 uppercase tracking-tight mb-4 text-center">Critical System Change</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-10 text-center font-body">
                Warning: Activating <span className="font-black text-slate-900">{selectedCycle.year_string}</span> will archive the current year and freeze all associated admission records.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmActivation}
                  className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-md hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 font-body"
                >
                  Confirm Activation
                </button>
                <button 
                  onClick={() => setIsConfirmOpen(false)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors font-body"
                >
                  Cancel and Abort
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

