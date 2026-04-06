import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '../../components/Header'
import { Sidebar } from '../../components/Sidebar'
import { masterService } from '../../services/masterService'
import { toast } from 'react-hot-toast'
import type { Department as AcademicDepartment, Program, Campus } from '../../types/master.types'

export const Department = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'department' | 'program'>('department')
  const [expandedDepts, setExpandedDepts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Extended type for joined results
  interface ExtendedProgram extends Program {
    campuses?: { name: string } | null
  }

  // Data states
  const [departments, setDepartments] = useState<AcademicDepartment[]>([])
  const [programs, setPrograms] = useState<ExtendedProgram[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [stats, setStats] = useState([
    { label: 'Total Departments', value: '0', sub: 'Across Architecture', icon: 'account_tree', color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Active Degrees', value: '0', sub: 'Initializing...', icon: 'school', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Degree Portfolio', value: '0', sub: 'Total Records', icon: 'layers', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Campus Footprint', value: '0', sub: 'Physical Sites', icon: 'location_on', color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ])

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', code: '', is_active: true })
  const [progForm, setProgForm] = useState({
    name: '',
    code: '',
    department_id: '',
    campus_id: '',
    course_level: 'Undergraduate (UG)',
    entry_type: 'Regular Entry',
    is_active: true
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [deptRes, progRes, campRes] = await Promise.all([
        masterService.getDepartments(false),
        masterService.getPrograms(undefined, false),
        masterService.getCampuses(undefined, true)
      ])

      const d = deptRes.data || []
      const p = progRes.data || []
      const c = campRes.data || []

      setDepartments(d)
      setPrograms(p)
      setCampuses(c)

      setStats([
        { 
          label: 'Total Departments', 
          value: d.length.toString(), 
          sub: `Spanning ${c.length} Campus Units`, 
          icon: 'account_tree', 
          color: 'text-primary', 
          bg: 'bg-primary/5' 
        },
        { 
          label: 'Active Degrees', 
          value: p.filter(prog => prog.is_active).length.toString(), 
          sub: `${p.filter(pr => pr.course_level?.includes('UG')).length} UG • ${p.filter(pr => pr.course_level?.includes('PG')).length} PG • ${p.filter(pr => pr.course_level?.includes('Diploma')).length} DIP`, 
          icon: 'school', 
          color: 'text-blue-600', 
          bg: 'bg-blue-50' 
        },
        { 
          label: 'Degree Portfolio', 
          value: p.length.toString(), 
          sub: 'Total Catalog Size', 
          icon: 'layers', 
          color: 'text-purple-600', 
          bg: 'bg-purple-50' 
        },
        { 
          label: 'Campus Footprint', 
          value: c.length.toString(), 
          sub: 'Live Physical Sites', 
          icon: 'location_on', 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-50' 
        }
      ])

      if (d.length > 0) setProgForm(prev => ({ ...prev, department_id: d[0].id }))
      if (c.length > 0) setProgForm(prev => ({ ...prev, campus_id: c[0].id }))

    } catch (err) {
      console.error(err)
      toast.error('Failed to sync academic components')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const openModal = (type: 'department' | 'program', data?: any) => {
    setModalType(type)
    if (type === 'department') {
      if (data) {
        setEditingId(data.id)
        setDeptForm({ name: data.name, code: data.code, is_active: data.is_active })
      } else {
        setEditingId(null)
        setDeptForm({ name: '', code: '', is_active: true })
      }
    } else {
      if (data && typeof data === 'object' && !Array.isArray(data) && data.name) {
        // Editing mode
        setEditingId(data.id)
        setProgForm({
          name: data.name || '',
          code: data.code || '',
          department_id: data.department_id || '',
          campus_id: data.campus_id || '',
          course_level: data.course_level || 'Undergraduate (UG)',
          entry_type: data.entry_type || 'Regular Entry',
          is_active: data.is_active ?? true
        })
      } else {
        // Create mode (data might be parentId string)
        setEditingId(null)
        setProgForm({
          name: '',
          code: '',
          department_id: typeof data === 'string' ? data : (departments[0]?.id || ''),
          campus_id: campuses[0]?.id || '',
          course_level: 'Undergraduate (UG)',
          entry_type: 'Regular Entry',
          is_active: true
        })
      }
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    const loader = toast.loading(editingId ? 'Syncing updates...' : 'Architecting component...')
    try {
      if (modalType === 'department') {
        const { error } = editingId 
          ? await masterService.updateDepartment(editingId, deptForm)
          : await masterService.createDepartment(deptForm)
        
        if (error) throw error
        toast.success(editingId ? 'Department updated' : 'Department architecture defined', { id: loader })
      } else {
        const { error } = editingId
          ? await masterService.updateProgram(editingId, progForm)
          : await masterService.createProgram(progForm)

        if (error) throw error
        toast.success(editingId ? 'Program updated' : 'Program curriculum provisioned', { id: loader })
      }
      setIsModalOpen(false)
      setEditingId(null)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Component deployment failed', { id: loader })
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
                <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-sm">Academic Architecture</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-satoshi font-black text-slate-900 tracking-tighter">Department & Program</h2>
              <p className="text-slate-500 font-body text-base font-medium max-w-2xl leading-relaxed">
                Defining the institutional software. Organise degrees into departments and deploy them across active campuses.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => openModal('department')}
                className="bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 ring-1 ring-black/5"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span> Add Department
              </button>
              <button 
                onClick={() => openModal('program')}
                className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-md hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">auto_stories</span> New Program
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

          {/* Main Content Area - Accordion Style */}
          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between px-6 mb-4">
              <h3 className="font-satoshi text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Academic Hierarchy</h3>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active Architecture</span>
                 <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300 shadow-sm shadow-black/5"></div> Maintenance Mode</span>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="py-24 text-center space-y-4 bg-white/50 rounded-xl border border-dashed border-slate-200">
                   <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto opacity-40"></div>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Fetching Curriculum Clusters...</p>
                </div>
              ) : (
                departments.map((dept) => {
                  const deptPrograms = programs.filter(p => p.department_id === dept.id);
                  return (
                    <div key={dept.id} className="bg-white border border-slate-200 rounded-md shadow-sm text-left group/card hover:border-slate-300 transition-all">
                      <div 
                        onClick={() => toggleDept(dept.id)}
                        className="flex items-center justify-between px-10 py-8 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-6 text-left">
                          <div className={`w-10 h-10 rounded-md border border-slate-200 flex items-center justify-center font-black text-[10px] tracking-tighter ${dept.is_active ? 'bg-slate-900 text-white shadow-lg shadow-black/10' : 'bg-slate-100 text-slate-400'}`}>
                            {dept.code}
                          </div>
                          <div>
                            <h4 className="font-satoshi font-black text-slate-900 text-lg tracking-tight uppercase leading-none">{dept.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 flex items-center gap-3">
                              {deptPrograms.length} Programs 
                              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                              <span className={dept.is_active ? 'text-emerald-500' : 'text-slate-300'}>
                                {dept.is_active ? 'Active Node' : 'Maintenance'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openModal('department', dept); }}
                            className="material-symbols-outlined text-slate-300 hover:text-primary transition-all p-2 rounded-xl hover:bg-primary/5 active:scale-90"
                          >
                            edit_square
                          </button>
                           <span className={`material-symbols-outlined text-slate-400 transition-transform duration-500 ease-[0.16, 1, 0.3, 1] ${expandedDepts.includes(dept.id) ? 'rotate-180' : ''}`}>
                            expand_more
                           </span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedDepts.includes(dept.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <div className="px-10 pb-10">
                              <div className="bg-slate-50/50 rounded-md border border-slate-100 overflow-hidden">
                                <table className="w-full text-left font-body">
                                  <thead>
                                    <tr className="border-b border-slate-100">
                                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Program Name</th>
                                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Campus</th>
                                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Level</th>
                                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Type</th>
                                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Status</th>
                                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Manage</th>
                                    </tr>
                                  </thead>
                                  <tbody className="text-[12px]">
                                    {deptPrograms.length > 0 ? (
                                      deptPrograms.map((prog) => (
                                        <tr key={prog.id} className="border-b border-slate-100 last:border-0 hover:bg-white transition-colors group">
                                          <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                              <span className="font-black text-slate-900 uppercase">{prog.name}</span>
                                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{prog.code}</span>
                                            </div>
                                          </td>
                                          <td className="px-8 py-6">
                                            <span className="font-bold text-slate-600 text-[10px] uppercase tracking-widest">
                                              {prog.campuses?.name || 'N/A'}
                                            </span>
                                          </td>
                                          <td className="px-8 py-6">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-[0.15em]">{prog.course_level}</span>
                                          </td>
                                          <td className="px-8 py-6 font-bold text-slate-400 text-[10px] uppercase">{prog.entry_type}</td>
                                          <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${prog.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                              <div className={`w-1 h-1 rounded-full ${prog.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                              {prog.is_active ? 'Live' : 'Hidden'}
                                            </div>
                                          </td>
                                          <td className="px-8 py-6 text-center">
                                            <button 
                                              onClick={() => openModal('program', prog)}
                                              className="material-symbols-outlined text-slate-300 hover:text-primary transition-all p-2 rounded-xl hover:bg-primary/5 active:scale-90 text-[18px]"
                                            >
                                              edit_square
                                            </button>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic font-medium font-body text-[11px] uppercase tracking-widest">
                                          No programs deployed in this sector.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
                                   <button 
                                    onClick={() => openModal('program', dept.id)}
                                    className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-all flex items-center gap-2 group/btn"
                                   >
                                     <span className="material-symbols-outlined text-sm group-hover/btn:rotate-90 transition-transform duration-300">add</span> Add Program in {dept.code}
                                   </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Global Modals */}
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
                    <h3 className="text-2xl font-satoshi font-black tracking-tight leading-none uppercase">
                      {editingId 
                        ? (modalType === 'department' ? 'UPDATE DEPARTMENT' : 'RECONFIGURE PROGRAM') 
                        : (modalType === 'department' ? 'DEFINE DEPARTMENT' : 'PROVISION PROGRAM')}
                    </h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
                      {editingId ? 'Modify Institutional Metadata' : 'Curated Academic Deployment'}
                    </p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">close</button>
                </div>
              </div>

              <div className="p-10 space-y-8 font-body">
                {modalType === 'department' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1 font-body">Department Full Name</label>
                      <input 
                        value={deptForm.name}
                        onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                        className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900 placeholder:font-medium placeholder:text-slate-300" 
                        placeholder="e.g., School of Business" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1 font-body">Department Code</label>
                        <input 
                          value={deptForm.code}
                          onChange={(e) => setDeptForm({...deptForm, code: e.target.value})}
                          className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono font-bold text-slate-900 placeholder:text-slate-300 uppercase" 
                          placeholder="SOB" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1 font-body">Lifecycle Status</label>
                        <div className="flex h-[58px] items-center px-5 rounded-xl border border-slate-200 bg-slate-50/50">
                           <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-primary" 
                                checked={deptForm.is_active} 
                                onChange={(e) => setDeptForm({...deptForm, is_active: e.target.checked})}
                              />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Active Node</span>
                           </label>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-4">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Parent Department</label>
                        <select 
                          value={progForm.department_id}
                          onChange={(e) => setProgForm({...progForm, department_id: e.target.value})}
                          className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-700"
                        >
                          <option value="">Select Dept...</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Target Campus</label>
                        <select 
                          value={progForm.campus_id}
                          onChange={(e) => setProgForm({...progForm, campus_id: e.target.value})}
                          className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-700"
                        >
                          <option value="">Choose Site...</option>
                          {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Program Formal Name</label>
                      <input 
                        value={progForm.name}
                        onChange={(e) => setProgForm({...progForm, name: e.target.value})}
                        className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900 placeholder:font-medium placeholder:text-slate-300" 
                        placeholder="e.g., Computer Science & Engineering" 
                      />
                    </div>
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Program Protocol Code</label>
                        <input 
                          value={progForm.code}
                          onChange={(e) => setProgForm({...progForm, code: e.target.value})}
                          className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono font-bold text-slate-900 placeholder:text-slate-300 uppercase" 
                          placeholder="CSE" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Course level</label>
                          <select 
                            value={progForm.course_level}
                            onChange={(e) => setProgForm({...progForm, course_level: e.target.value})}
                            className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-700"
                          >
                            <option value="Undergraduate (UG)">Undergraduate (UG)</option>
                            <option value="Postgraduate (PG)">Postgraduate (PG)</option>
                            <option value="Diploma">Diploma</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Entry Type</label>
                          <select 
                            value={progForm.entry_type}
                            onChange={(e) => setProgForm({...progForm, entry_type: e.target.value as 'Regular Entry' | 'Lateral Entry'})}
                            className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-700"
                          >
                            <option value="Regular Entry">Regular Entry</option>
                            <option value="Lateral Entry">Lateral Entry</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Deployment Status</label>
                        <div className="flex h-[58px] items-center px-5 rounded-xl border border-slate-200 bg-slate-50/50">
                           <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-primary" 
                                checked={progForm.is_active} 
                                onChange={(e) => setProgForm({...progForm, is_active: e.target.checked})}
                              />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Provision Architecture</span>
                           </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-8 border-t border-slate-100">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all font-body">Abort</button>
                  <button 
                    onClick={handleSave}
                    className="flex-[1.5] px-4 py-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-slate-900/40 font-body"
                  >
                    {editingId 
                      ? (modalType === 'department' ? 'SAVE CHANGES' : 'UPDATE CURRICULUM') 
                      : (modalType === 'department' ? 'ADD DEPARTMENT' : 'PROVISION PROGRAM')}
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

