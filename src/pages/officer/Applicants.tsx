import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'react-hot-toast'
import { Header } from '../../components/Header'
import { Sidebar } from '../../components/Sidebar'
import { ApplicantDetail } from './ApplicantDetail'
import { applicantService } from '../../services/applicantService'
import { rulebookService } from '../../services/rulebookService'
import { supabase } from '../../lib/supabase/client'

interface DropdownProps {
  icon: string
  label: string
  value: string
  options: string[]
  setVal: (val: string) => void
  align?: 'left' | 'right'
}

const FilterDropdown = ({ icon, label, value, options, setVal, align = 'left' }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative text-left">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${isOpen ? 'bg-surface-container shadow-sm' : 'bg-surface hover:bg-surface-container'}`}
      >
        <span className="material-symbols-outlined text-[18px] text-outline" data-icon={icon}>{icon}</span>
        <div className="min-w-0 flex flex-col justify-center">
          <p className="text-[10px] font-label font-bold uppercase tracking-[0.18em] text-outline leading-tight">{label}</p>
          <p className="truncate font-satoshi text-sm font-black text-on-surface leading-tight mt-0.5">{value}</p>
        </div>
        <span className={`material-symbols-outlined text-[18px] text-outline transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} data-icon="expand_more">expand_more</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-3 min-w-[240px] bg-white rounded-[1.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-surface-container/60 z-50 p-2 ring-1 ring-black/5 text-left`}
          >
            <div className="flex flex-col gap-1 text-left">
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setVal(opt); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-satoshi transition-all duration-200 ${value === opt ? 'bg-primary/5 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {opt}
                  {value === opt && (
                    <span className="material-symbols-outlined text-[18px] text-primary" data-icon="check_circle">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface MappedApplicant {
  id: string;
  application_no: string;
  name: string;
  program: string;
  quota: string;
  docStatus: string;
  docStatusType: string;
  feeStatus: string;
  feeStatusType: string;
  status: string;
  phone: string;
  email: string | null;
  dob: string;
  category: string;
  campus: string;
  rawStatus: string;
  createdAt: string;
}

export function Applicants() {
  const [searchQuery, setSearchQuery] = useState('')
  const [program, setProgram] = useState('All Programs')
  const [campusFilter, setCampusFilter] = useState('All Campuses')
  const [quota, setQuota] = useState('All Quotas')
  const [pipeline, setPipeline] = useState('All Pipeline')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<MappedApplicant | null>(null)

  const [applicants, setApplicants] = useState<MappedApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [availableCampuses, setAvailableCampuses] = useState<string[]>([])
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([])

  const fetchApplicants = async () => {
    try {
      setLoading(true)
      const { data, error } = await applicantService.getApplicants()
      if (error) throw error
      
      const mapped = (data || []).map(app => {
        const docStatus = ['DOCUMENTS_VERIFIED', 'FEE_PAID', 'CONFIRMED'].includes(app.status) ? 'Verified' : 'Pending'
        const feeStatus = ['FEE_PAID', 'CONFIRMED'].includes(app.status) ? 'Paid' : 'Pending'
        
        const displayStatus: Record<string, string> = {
          'LEAD': 'Lead',
          'SEAT_LOCKED': 'Seat Locked',
          'DOCUMENTS_VERIFIED': 'Docs Verified',
          'FEE_PAID': 'Fee Paid',
          'CONFIRMED': 'Confirmed',
          'WITHDRAWN': 'Withdrawn',
          'CANCELLED': 'Cancelled'
        }

        return {
          id: app.id,
          application_no: app.application_no || app.id.slice(0, 8).toUpperCase(),
          name: app.full_name,
          program: app.programs?.code || 'UNKNOWN',
          quota: app.quota_type || 'N/A',
          docStatus,
          docStatusType: docStatus === 'Verified' ? 'success' : 'warning',
          feeStatus,
          feeStatusType: feeStatus === 'Paid' ? 'success' : 'error',
          status: displayStatus[app.status] || app.status,
          phone: app.mobile,
          email: app.email,
          dob: app.dob,
          category: app.category,
          campus: app.campuses?.name || 'N/A',
          rawStatus: app.status,
          createdAt: app.created_at
        }
      })
      setApplicants(mapped)
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch applicant pipeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplicants();
    // Load dynamic filter options
    (async () => {
      try {
        const { data: camps } = await supabase.from('campuses').select('name');
        const { data: progs } = await supabase.from('programs').select('code');
        if (camps) setAvailableCampuses(['All Campuses', ...new Set(camps.map((c: any) => c.name))]);
        if (progs) setAvailablePrograms(['All Programs', ...new Set(progs.map((p: any) => p.code))]);
      } catch (err) {
        console.error("Failed to load filter options", err)
      }
    })();
  }, [])

  const handleAction = async (e: React.MouseEvent, action: string, item: MappedApplicant) => {
    e.stopPropagation()
    setSelectedApplicant(item)
    setActiveMenuId(null)
    
    if (action === 'View Profile') {
      setIsViewModalOpen(true)
    } else if (action === 'Edit Status') {
      setIsDetailOpen(true)
    } else if (action === 'Mark as Cancelled') {
      if (confirm(`Are you sure you want to withdraw the application for ${item.name}?`)) {
        const loader = toast.loading('Executing cancellation protocol...')
        try {
          const { error } = await applicantService.updateApplicant(item.id, { status: 'CANCELLED' })
          if (error) throw error
          toast.success(`${item.name}'s application has been securely cancelled.`, { id: loader })
          fetchApplicants()
        } catch (err) {
          console.error(err)
          toast.error('Cancellation failed. Please check your clearance levels.', { id: loader })
        }
      }
    }
  }

  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      if (program !== 'All Programs' && app.program !== program) return false
      if (campusFilter !== 'All Campuses' && app.campus !== campusFilter) return false
      if (quota !== 'All Quotas' && app.quota !== quota) return false
      
      if (pipeline !== 'All Pipeline') {
        if (pipeline === 'Missing Docs' && app.docStatus !== 'Pending') return false
        if (pipeline === 'Pending Fees' && app.feeStatus !== 'Pending') return false
        if (pipeline === 'Confirmed' && app.status !== 'Confirmed') return false
      }
      
      if (searchQuery && !app.name.toLowerCase().includes(searchQuery.toLowerCase()) && !app.application_no.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      return true
    })
  }, [applicants, program, campusFilter, quota, pipeline, searchQuery])
  
  const stats = useMemo(() => {
    const total = filteredApplicants.length
    const locked = filteredApplicants.filter(a => a.rawStatus === 'SEAT_LOCKED').length
    const confirmed = filteredApplicants.filter(a => a.rawStatus === 'CONFIRMED').length
    const urgent = filteredApplicants.filter(a => a.feeStatus === 'Pending' && a.rawStatus !== 'LEAD' && a.rawStatus !== 'WITHDRAWN' && a.rawStatus !== 'CANCELLED').length
    
    // Efficiency Rate
    const confirmedRate = total > 0 ? Math.round((confirmed / total) * 100) : 0
    
    // Intake average: counts items from the last 7 days / 7
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentIntake = filteredApplicants.filter(a => new Date(a.createdAt) >= sevenDaysAgo).length
    const intakeAverage = Math.round(recentIntake / 7)

    return { total, locked, confirmed, urgent, confirmedRate, intakeAverage }
  }, [filteredApplicants])

  return (
    <>
      <Sidebar />
      <main className="md:ml-28 min-h-screen text-left">
        <Header />
        <div className="px-12 pb-12 space-y-10 text-left">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pt-4"
          >
            <div className="text-left">
              <h2 className="text-6xl font-satoshi font-black text-primary tracking-tighter text-left leading-tight">Applicant Queue</h2>
              <p className="text-outline mt-3 font-body text-lg max-w-lg leading-relaxed text-left">Manage and process student admissions architecture for the <span className="font-bold text-primary">2025-26</span> Admissions Cycle.</p>
            </div>

            <div className="flex items-center gap-1.5 bg-surface-container-lowest p-1.5 rounded-2xl border border-white shadow-sm ring-1 ring-black/5">
                <FilterDropdown icon="location_on" label="Campus" value={campusFilter} setVal={setCampusFilter} options={availableCampuses.length > 0 ? availableCampuses : ['All Campuses']} align="left" />
                <div className="w-[1px] h-6 bg-surface-container mx-1 opacity-50"></div>
                <FilterDropdown icon="school" label="Program" value={program} setVal={setProgram} options={availablePrograms.length > 0 ? availablePrograms : ['All Programs']} align="left" />
                <div className="w-[1px] h-6 bg-surface-container mx-1 opacity-50"></div>
                <FilterDropdown icon="account_balance_wallet" label="Quota" value={quota} setVal={setQuota} options={['All Quotas', 'KCET', 'COMEDK', 'Management']} align="left" />
                <div className="w-[1px] h-6 bg-surface-container mx-1 opacity-50"></div>
                <FilterDropdown icon="flag" label="Pipeline" value={pipeline} setVal={setPipeline} options={['All Pipeline', 'Missing Docs', 'Pending Fees', 'Confirmed']} align="right" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* KPI CARDS REMAINED UNTOUCHED */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white transition-all hover:shadow-[0px_40px_80px_rgba(0,0,0,0.05)] hover:-translate-y-1 group">
              <div className="flex justify-between items-start mb-6">
                <span className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary text-left">
                  <span className="material-symbols-outlined text-2xl" data-icon="group">group</span>
                </span>
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-label text-outline uppercase font-bold mb-1">Total Processed</span>
                  <div className="flex items-center gap-1 text-secondary font-bold text-xs bg-secondary-container/30 px-2 py-0.5 rounded-full text-right"><span className="material-symbols-outlined text-[14px]">analytics</span> Live</div>
                </div>
              </div>
              <div className="space-y-4 text-left">
                <p className="text-4xl font-satoshi font-black text-left">{stats.total} <span className="text-sm font-body font-medium text-outline">Applicants</span></p>
                <div className="h-8 flex items-end gap-1 overflow-hidden opacity-30 group-hover:opacity-60 transition-opacity">
                  {[30, 45, 40, 55, 75, 60, 45].map((h, i) => (<motion.div key={i} whileHover={{ scaleY: 1.1 }} className={`w-2 bg-primary rounded-t-sm`} style={{ height: `${h}%` }}></motion.div>))}
                </div>
                <p className="text-xs text-outline leading-relaxed font-body font-medium text-left">Daily intake average: +{stats.intakeAverage}</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white transition-all hover:shadow-[0px_40px_80px_rgba(0,0,0,0.05)] hover:-translate-y-1 group text-left">
              <div className="flex justify-between items-start mb-6 text-left">
                <span className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined text-2xl" data-icon="lock_clock">lock_clock</span>
                </span>
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-label text-outline uppercase font-bold mb-1">Seats Locked</span>
                  <div className="flex items-center gap-1 text-secondary font-bold text-xs bg-secondary-container/30 px-2 py-0.5 rounded-full text-right"><span className="material-symbols-outlined text-[14px]">history</span> Pending</div>
                </div>
              </div>
              <div className="space-y-4 text-left font-body">
                <p className="text-4xl font-satoshi font-black text-left">{stats.locked} <span className="text-sm font-body font-medium text-outline">In Pipeline</span></p>
                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden text-left"><motion.div initial={{ width: 0 }} animate={{ width: `${(stats.locked / (stats.total || 1)) * 100}%` }} transition={{ duration: 1, delay: 0.5 }} className="bg-secondary h-full rounded-full"></motion.div></div>
                <p className="text-xs font-bold text-secondary tracking-widest uppercase text-left">Awaiting Documentation</p>
              </div>
            </motion.div>

             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white transition-all hover:shadow-[0px_40px_80px_rgba(0,0,0,0.05)] hover:-translate-y-1 group">
              <div className="flex justify-between items-start mb-6">
                <span className="w-12 h-12 bg-green-100/50 rounded-xl flex items-center justify-center text-green-600 text-left"><span className="material-symbols-outlined text-2xl" data-icon="check_circle">check_circle</span></span>
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-label text-outline uppercase font-bold mb-1">Confirmed</span>
                  <div className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded-full text-right"><span className="material-symbols-outlined text-[14px]">trending_up</span> {stats.confirmedRate}% Rate</div>
                </div>
              </div>
              <div className="space-y-4 text-left font-body">
                <p className="text-4xl font-satoshi font-black text-left">{stats.confirmed} <span className="text-sm font-body font-medium text-outline">Students</span></p>
                <div className="flex items-end gap-1 h-8 opacity-30 group-hover:opacity-60 transition-opacity">
                  {[20, 30, 45, 60, 80, 95].map((h, i) => (<motion.div key={i} whileHover={{ scaleY: 1.1 }} className={`w-2 bg-green-500 rounded-t-sm`} style={{ height: `${h}%` }}></motion.div>))}
                </div>
                <p className="text-xs text-outline leading-relaxed font-body font-medium text-left">Successfully onboarded</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-error/5 p-8 rounded-2xl border border-error/10 hover:border-error/20 transition-all shadow-[0px_30px_60px_rgba(0,0,0,0.02)] hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden text-left">
               <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-bl-full translate-x-12 -translate-y-12 opacity-20 text-left"></div>
               <div className="flex justify-between items-start mb-6 relative z-10 text-left">
                <span className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center text-error"><span className="material-symbols-outlined text-2xl" data-icon="warning">warning</span></span>
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-label text-error uppercase font-black mb-1 text-right">Critical Action</span>
                  <div className="flex items-center gap-1 text-error font-bold text-xs bg-error/10 px-2 py-0.5 rounded-full text-right"><span className="material-symbols-outlined text-[14px]">priority_high</span> Immediate</div>
                </div>
              </div>
              <div className="space-y-4 text-left relative z-10 font-body">
                <p className="text-4xl font-satoshi font-black text-error text-left">{stats.urgent} <span className="text-sm font-body font-medium text-error/60">Urgent</span></p>
                <div className="flex items-end gap-1 h-8 opacity-40">
                  {[90, 85, 70, 95, 80, 100].map((h, i) => (<motion.div key={i} className={`w-2 bg-error rounded-t-sm`} style={{ height: `${h}%` }}></motion.div>))}
                </div>
                <p className="text-xs font-bold text-error leading-relaxed uppercase tracking-widest text-left">Pending fee clearance</p>
              </div>
            </motion.div>
          </div>

          {/* Streamlined Action Bar */}
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1 w-full relative group">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 text-2xl font-light group-focus-within:text-primary transition-colors z-10">search</span>
              <input 
                type="text" 
                placeholder="Search Applicant by Name or Application ID..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-16 pr-8 py-4.5 bg-surface-container-lowest border border-white rounded-2xl text-on-surface outline-none shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium text-sm placeholder:text-outline/30" 
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={() => setIsAddModalOpen(true)} 
              className="w-full lg:w-auto bg-primary text-white px-8 py-4.5 rounded-2xl font-black text-[12px] uppercase tracking-[0.15em] shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shrink-0"
            >
              <span className="material-symbols-outlined text-xl">person_add</span> Add New Applicant
            </motion.button>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-surface-container-lowest border border-white rounded-3xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] text-left">
            <div className="overflow-x-auto text-left rounded-3xl">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-surface/30 border-b border-surface-container text-[11px] uppercase font-black text-outline tracking-[0.25em] text-left"><th className="py-7 px-10 text-left font-body">Applicant Detail</th><th className="py-7 px-6 text-left font-body">Program & Quota</th><th className="py-7 px-6 text-left font-body">Clearance Status</th><th className="py-7 px-6 text-left font-body">Overall Pipeline</th><th className="py-7 px-10 text-center font-body">Action</th></tr></thead>
                <tbody className="divide-y divide-surface-container/30 text-left">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-outline font-satoshi animate-pulse">Synchronizing with central pipeline...</td>
                    </tr>
                  ) : filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-outline font-satoshi">No matched applicants found.</td>
                    </tr>
                  ) : filteredApplicants.map((item, i) => (
                    <motion.tr key={i} whileHover={{ backgroundColor: "var(--color-surface-container-low)" }} className="group cursor-pointer transition-colors text-left" onClick={() => { setSelectedApplicant(item); setIsDetailOpen(true); }}>
                      <td className="py-7 px-10 text-left"><div className="flex items-center gap-5 text-left font-body"><div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-xl shadow-sm transition-all group-hover:bg-primary group-hover:text-white group-hover:border-primary">{item.name.charAt(0)}</div><div className="text-left font-body"><div className="font-satoshi font-black text-blue-900 group-hover:text-primary transition-colors text-lg text-left">{item.name}</div><div className="text-[11px] text-outline font-black uppercase tracking-[0.15em] mt-1 text-left opacity-60">{item.application_no}</div></div></div></td>
                      <td className="py-7 px-6 text-left font-body"><div className="font-satoshi font-black text-sm text-blue-950 text-left">{item.program}</div><div className="text-[11px] text-outline font-black uppercase tracking-widest mt-1.5 text-left opacity-70">{item.quota}</div></td>
                      <td className="py-7 px-6 text-left font-body text-left font-body font-black uppercase text-[10px]">
                         <div className="flex flex-col gap-2.5 text-left">
                          <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl w-max shadow-sm ${item.docStatusType === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}><span className="material-symbols-outlined text-[17px]">verified</span> Docs: {item.docStatus}</span>
                          <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl w-max shadow-sm ${item.feeStatusType === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-error/10 text-error border border-error/10'}`}><span className="w-2 h-2 rounded-full bg-current animate-pulse"></span> Fees: {item.feeStatus}</span>
                        </div>
                      </td>
                      <td className="py-7 px-6 text-left font-body"><div className="font-satoshi font-black text-sm text-blue-900 text-left">{item.status}</div><div className="mt-2.5 w-28 bg-surface-container h-2 rounded-full overflow-hidden text-left shadow-inner"><div className={`h-full transition-all duration-1000 ${item.status === 'Confirmed' ? 'bg-green-500 w-full' : 'bg-secondary w-2/3'}`}></div></div></td>
                      <td className="py-7 px-10 text-center relative">
                        <div className="flex items-center justify-center text-center">
                          <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }} className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all border shadow-lg ${activeMenuId === item.id ? 'bg-primary text-white border-primary' : 'bg-white text-outline hover:bg-primary/5 hover:text-primary border-surface-container'}`}>
                            <span className="material-symbols-outlined text-2xl font-bold">more_vert</span>
                          </button>
                        </div>
                        <AnimatePresence>{activeMenuId === item.id && (<><div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div><motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -5 }} className="absolute right-12 top-[85%] w-[230px] bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-surface-container/60 z-50 p-2 ring-1 ring-black/5 text-left"><button onClick={(e) => handleAction(e, 'View Profile', item)} className="w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.14em] text-outline hover:bg-primary/5 hover:text-primary flex items-center gap-3.5 transition-all outline-none leading-none"><span className="material-symbols-outlined text-[20px] font-medium">visibility</span> View Profile</button><button onClick={(e) => handleAction(e, 'Edit Status', item)} className="w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.14em] text-outline hover:bg-primary/5 hover:text-primary flex items-center gap-3.5 transition-all outline-none leading-none"><span className="material-symbols-outlined text-[20px] font-medium">clinical_notes</span> Process Admission</button><div className="h-[1px] bg-surface-container/50 my-2 mx-3 text-left"></div><button onClick={(e) => handleAction(e, 'Mark as Cancelled', item)} className="w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.14em] text-error hover:bg-error/5 flex items-center gap-3.5 transition-all outline-none leading-none"><span className="material-symbols-outlined text-[20px] font-medium">block</span> Mark as Cancelled</button></motion.div></>)}</AnimatePresence>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <AddApplicantModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => fetchApplicants()}
      />
          <ViewApplicantModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} applicant={selectedApplicant} />
        <ApplicantDetail
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            fetchApplicants()
          }}
          applicantId={selectedApplicant?.id}
        />
        </div>
      </main>
    </>
  )
}

interface AddApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddApplicantModal: React.FC<AddApplicantModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Master Data
  const [campuses, setCampuses] = useState<{id: string, name: string}[]>([]);
  const [programs, setPrograms] = useState<{id: string, name: string, code: string, course_level: string}[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: 'Male',
    mobile: '',
    email: '',
    govt_id: '',
    qualifying_exam: '12th Board',
    percentage: '',
    subject_combo: 'PCMB',
    campus_id: '',
    program_id: '',
    course_level: 'Undergraduate (UG)',
    entry_type: 'Regular',
    quota_type: 'Management',
    category: 'General',
    status: 'LEAD' as any
  });

  const [courseLevels, setCourseLevels] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const { data: camps } = await supabase.from('campuses').select('id, name');
          const { data: progs } = await supabase.from('programs').select('id, name, code, course_level');
          
          if (camps) setCampuses(camps);
          if (progs) {
            setPrograms(progs);
            const levels = [...new Set(progs.map(p => p.course_level))].filter(Boolean) as string[];
            setCourseLevels(levels.length > 0 ? levels : ['Undergraduate (UG)', 'Postgraduate (PG)']);
          }
          
          if (camps && camps.length > 0) setFormData(prev => ({ ...prev, campus_id: camps[0].id }));
          if (progs && progs.length > 0) {
            setFormData(prev => ({ 
              ...prev, 
              program_id: progs[0].id,
              course_level: progs[0].course_level || 'Undergraduate (UG)'
            }));
          }
        } catch (err) {
          console.error("Failed to load master data", err);
        }
      })();
    } else {
      setStep(1);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.mobile) {
      toast.error('Name and Mobile are required');
      return;
    }

    try {
      setSubmitting(true);
      
      // Auto-generate a unique application number for Quick Intake
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(100 + Math.random() * 900);
      const applicationNo = `APP-${timestamp}${random}`;
      
      const payload = { ...formData, application_no: applicationNo };
      const { data: newApp, error } = await applicantService.createApplicant(payload as any);
      if (error) throw error;
      
      // Automatic Document Seeding: Link masters to the fresh applicant
      try {
        const { data: masters } = await rulebookService.getDocumentMasters();
        if (masters && masters.length > 0 && newApp) {
          const quotaVal = (payload.quota_type === 'Management' ? 'Management Only' : 'Government Only');
          const levelVal = payload.course_level.includes('UG') ? 'UG Only' : 'PG Only';
          
          const applicable = masters.filter(m => {
            const qMatch = m.quota_req === 'All Quotas' || m.quota_req === 'Both' || m.quota_req === quotaVal || m.quota_req === 'Government Only';
            const lMatch = m.course_level_req === 'All Levels' || m.course_level_req === levelVal;
            return qMatch && lMatch;
          });

          if (applicable.length > 0) {
            await applicantService.bulkCreateDocuments(
              applicable.map(m => ({ 
                applicant_id: (newApp as any).id, 
                document_master_id: m.id 
              }))
            );
          }
        }
      } catch (seedErr) {
        console.warn("Non-fatal: Document seeding failed", seedErr);
      }
      
      // Automatic Fee Record Initialization: Ensure payment container exists
      try {
         if (newApp) {
           await applicantService.createFeeRecord((newApp as any).id, 0);
         }
      } catch (feeErr) {
         console.warn("Non-fatal: Fee record init failed", feeErr);
      }
      
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to register applicant.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-blue-950/60 backdrop-blur-md" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 text-center shadow-2xl border border-white"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
             <motion.span 
               initial={{ scale: 0 }} 
               animate={{ scale: 1 }} 
               transition={{ type: 'spring', damping: 10, stiffness: 100 }}
               className="material-symbols-outlined text-5xl font-black"
             >check_circle</motion.span>
          </div>
          <h3 className="text-3xl font-satoshi font-black text-blue-900 mb-3 leading-tight">Registration <br/> Successful!</h3>
          <p className="text-outline font-medium mb-8 leading-relaxed">The applicant has been successfully onboarded into the central pipeline.</p>
          <button 
            onClick={onClose}
            className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-primary transition-all shadow-xl shadow-blue-900/10 active:scale-95"
          >
            Done & Continue
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-left">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm shadow-2xl overflow-hidden" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.25)] border border-surface-container flex flex-col max-h-[85vh] text-left">
          <div className="p-6 md:p-8 border-b border-surface-container flex justify-between items-center bg-surface-container-lowest text-left shadow-sm">
            <div className="flex items-center gap-5 text-left">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-left shadow-inner"><span className="material-symbols-outlined text-2xl md:text-3xl font-medium">person_add</span></div>
              <div className="text-left font-body">
                <h3 className="text-2xl md:text-3xl font-satoshi font-black text-blue-900 tracking-tight text-left leading-none">Quick Intake Form</h3>
                <div className="flex items-center gap-4 mt-3 scale-90 md:scale-100 origin-left">
                   {[1, 2, 3].map(s => (
                     <div key={s} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500 shadow-sm ${step === s ? 'bg-primary border-primary text-white' : step > s ? 'bg-green-500 border-green-500 text-white' : 'border-outline/20 text-outline/30'}`}>{step > s ? <span className="material-symbols-outlined text-[14px] font-black">check</span> : s}</div>
                        {s < 3 && <div className={`h-1 w-8 rounded-full transition-all duration-700 ${step > s ? 'bg-green-500' : 'bg-surface-container'}`}></div>}
                     </div>
                   ))}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center text-outline text-right bg-surface-container/30 hover:scale-105 active:scale-95 transition-all"><span className="material-symbols-outlined text-xl font-black">close</span></button>
          </div>
          <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar text-left font-body flex-1 bg-slate-50/30">
             <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-left">
                    <div className="flex items-center gap-4 text-primary text-left"><span className="material-symbols-outlined text-2xl font-medium">fingerprint</span><h4 className="font-satoshi font-black text-[15px] uppercase tracking-[0.25em] text-left">Section 1: Personal Identity</h4><div className="flex-1 h-[2px] bg-gradient-to-r from-primary/20 to-transparent"></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-left">
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 text-left opacity-60">Full Name</label><input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} placeholder="John Doe" className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm hover:border-primary/30 transition-all text-sm font-black text-blue-900" /></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 text-left opacity-60">Date of Birth</label><input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm transition-all text-sm font-black text-blue-950" /></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 text-left opacity-60">Gender</label><div className="relative"><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm appearance-none text-sm font-black text-blue-950"><option>Male</option><option>Female</option><option>Other</option></select><span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span></div></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 text-left opacity-60">Mobile Number</label><input type="text" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} placeholder="Enter 10-digit #" className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm transition-all text-sm font-black text-blue-950" /></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 text-left opacity-60">Email Address</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="student@edu.com" className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm transition-all text-sm font-black text-blue-950" /></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 text-left opacity-60">Government ID / Aadhar</label><input type="text" value={formData.govt_id} onChange={(e) => setFormData({...formData, govt_id: e.target.value})} placeholder="XXXX-XXXX-XXXX" className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm transition-all text-sm font-black text-blue-950" /></div>
                    </div>
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-left">
                    <div className="flex items-center gap-4 text-secondary text-left"><span className="material-symbols-outlined text-2xl font-medium">school</span><h4 className="font-satoshi font-black text-[15px] uppercase tracking-[0.25em] text-left">Section 2: Academic Background</h4><div className="flex-1 h-[2px] bg-gradient-to-r from-secondary/20 to-transparent"></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-left">
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 text-left opacity-60">Qualifying Exam</label><select value={formData.qualifying_exam} onChange={(e) => setFormData({...formData, qualifying_exam: e.target.value})} className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm appearance-none text-sm font-black text-blue-950 font-body"><option>12th Board</option><option>Diploma</option><option>UG Degree</option></select></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 text-left opacity-60">Percentage / CGPA</label><input type="number" value={formData.percentage} onChange={(e) => setFormData({...formData, percentage: e.target.value})} placeholder="Enter Score" className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm text-sm font-black text-blue-950" /></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 text-left opacity-60">Subject Combination</label><select value={formData.subject_combo} onChange={(e) => setFormData({...formData, subject_combo: e.target.value})} className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm appearance-none text-sm font-black text-blue-950 font-body"><option>PCMB</option><option>Commerce</option><option>Arts</option></select></div>
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-left">
                    <div className="flex items-center gap-4 text-blue-900/50 text-left font-body font-black uppercase text-[10px] tracking-[0.3em] font-label"><span className="material-symbols-outlined text-2xl font-medium">track_changes</span><h4 className="font-satoshi font-black text-[15px] uppercase tracking-[0.25em] text-left">Section 3: Admission Target</h4><div className="flex-1 h-[2px] bg-gradient-to-r from-blue-900/10 to-transparent"></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-left font-body">
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 opacity-60">Target Campus</label><select value={formData.campus_id} onChange={(e) => setFormData({...formData, campus_id: e.target.value})} className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm appearance-none text-sm font-black text-blue-950 font-body">{campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 opacity-60">Course Level</label><select value={formData.course_level} onChange={(e) => setFormData({...formData, course_level: e.target.value})} className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm appearance-none text-sm font-black text-blue-950 font-body">{courseLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}</select></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 opacity-60">Target Program</label><select value={formData.program_id} onChange={(e) => setFormData({...formData, program_id: e.target.value})} className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm appearance-none text-sm font-black text-blue-950 font-body">{programs.filter(p => !formData.course_level || p.course_level === formData.course_level).map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}</select></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 opacity-60">Target Quota</label><select value={formData.quota_type} onChange={(e) => setFormData({...formData, quota_type: e.target.value})} className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm appearance-none text-sm font-black text-blue-950 font-body"><option value="KCET">KCET</option><option value="COMEDK">COMEDK</option><option value="Management">Management</option></select></div>
                       <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-outline tracking-[0.2em] ml-1 opacity-60">Category</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-3.5 bg-white rounded-xl border border-surface-container outline-none focus:border-primary shadow-sm appearance-none text-sm font-black text-blue-950 font-body"><option>General</option><option>SC</option><option>ST</option><option>OBC</option></select></div>
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
          <div className="p-6 md:p-8 border-t border-surface-container flex items-center justify-between bg-white text-right font-body shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
            <button onClick={onClose} className="px-6 py-3.5 md:px-10 md:py-4.5 rounded-full font-black text-[10px] md:text-[12px] uppercase tracking-[0.25em] text-outline hover:text-blue-900 transition-all hover:bg-surface-container/30">Cancel Intake</button>
            <div className="flex gap-4 md:gap-5">
               {step > 1 && <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(step - 1)} className="px-6 py-3.5 md:px-10 md:py-4.5 rounded-full font-black text-[10px] md:text-[12px] uppercase tracking-[0.2em] text-primary border-2 border-primary/10 hover:bg-primary/5 transition-all outline-none">Go Back</motion.button>}
               <motion.button 
                 whileTap={{ scale: 0.97 }}
                 disabled={submitting}
                 onClick={() => { if(step < 3) setStep(step + 1); else handleSubmit(); }} 
                 className={`px-8 py-4 md:px-14 md:py-5 rounded-full font-black text-[11px] md:text-[13px] uppercase tracking-[0.25em] shadow-2xl transition-all outline-none flex items-center gap-3 ${submitting ? 'opacity-50 cursor-not-allowed' : ''} ${step === 3 ? 'bg-green-600 shadow-green-100 text-white hover:bg-green-700' : 'bg-primary shadow-primary/20 text-white hover:bg-blue-700'}`}
               >
                 {submitting ? 'Processing...' : step === 3 ? <><span className="material-symbols-outlined text-[18px] md:text-[24px]">how_to_reg</span> Finish</> : <><span className="material-symbols-outlined text-[18px] md:text-[24px]">arrow_forward</span> Next</>}
               </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const ViewApplicantModal = ({ isOpen, onClose, applicant }: { isOpen: boolean, onClose: () => void, applicant: MappedApplicant | null }) => {
  if (!isOpen || !applicant) return null
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-left font-body">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm shadow-2xl" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-surface-container flex flex-col max-h-[90vh] text-left font-body">
          <div className="p-12 bg-primary/5 flex flex-shrink-0 items-center gap-10 border-b border-surface-container text-left shadow-sm">
            <div className="w-28 h-28 rounded-[2.25rem] bg-primary flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-primary/30 border-4 border-white transition-transform hover:rotate-3">{applicant.name.charAt(0)}</div>
            <div className="text-left font-body">
               <h3 className="text-5xl font-satoshi font-black text-blue-900 text-left leading-none tracking-tighter">{applicant.name}</h3>
               <div className="flex items-center gap-4 mt-4 font-body"><span className="px-4 py-1.5 bg-primary rounded-xl text-[11px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-primary/10">{applicant.id}</span> <div className="h-2 w-2 rounded-full bg-outline/20"></div> <span className="text-base font-bold text-outline opacity-80">{applicant.status}</span></div>
            </div>
          </div>
          <div className="p-12 grid grid-cols-2 gap-12 text-left font-body overflow-y-auto">
             <div className="space-y-2 text-left"><p className="text-[11px] font-black uppercase text-outline tracking-[0.25em] opacity-60">Program Applied</p><p className="font-satoshi font-black text-2xl text-blue-950 tracking-tight">{applicant.program}</p></div>
             <div className="space-y-2 text-left"><p className="text-[11px] font-black uppercase text-outline tracking-[0.25em] opacity-60">Selected Quota</p><p className="font-satoshi font-black text-2xl text-blue-950 tracking-tight">{applicant.quota}</p></div>
             <div className="space-y-2 text-left"><p className="text-[11px] font-black uppercase text-outline tracking-[0.25em] opacity-60">Contact Phone</p><p className="font-black text-on-surface text-xl">{applicant.phone}</p></div>
             <div className="space-y-2 text-left"><p className="text-[11px] font-black uppercase text-outline tracking-[0.25em] opacity-60">Digital Mail</p><p className="font-black text-on-surface text-xl">{applicant.email}</p></div>
          </div>
          <div className="p-12 bg-slate-50 border-t border-surface-container flex flex-shrink-0 justify-end text-right"><button onClick={onClose} className="px-14 py-4.5 bg-primary text-white rounded-full font-black text-[13px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 text-right">Dismiss Profile</button></div>
        </motion.div>
      </div></AnimatePresence>
  )
}

// EditApplicantModal has been DEPRECATED.
// Status changes are now enforced through the ApplicantDetail 4-tab workflow
// which validates against the Seat Matrix, Document Master, and Fee records.
