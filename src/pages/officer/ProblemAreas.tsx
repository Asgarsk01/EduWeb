import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Header } from '../../components/Header'
import { Sidebar } from '../../components/Sidebar'
import { problemService } from '../../services/problemService'
import { applicantService } from '../../services/applicantService'

type PriorityFilter = 'Overdue Fees' | 'Missing Docs' | 'Stale Apps'

interface ProblemRecord {
  id: string
  application_no: string
  name: string
  program: string
  quota: string
  bottleneck: string
  daysPending: number
  phone: string
  type: PriorityFilter
}

export const ProblemAreas = () => {
  const [activeFilter, setActiveFilter] = useState<PriorityFilter>('Overdue Fees')
  const [withdrawTarget, setWithdrawTarget] = useState<ProblemRecord | null>(null)
  const [reminderTarget, setReminderTarget] = useState<ProblemRecord | null>(null)

  const [problems, setProblems] = useState<ProblemRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProblems = async () => {
    try {
      setLoading(true)
      const { data, error } = await problemService.getProblemAreas()
      if (error) throw error

      const typeMapping: Record<string, PriorityFilter> = {
        'OVERDUE_FEES': 'Overdue Fees',
        'MISSING_DOCS': 'Missing Docs',
        'STALE_APPS': 'Stale Apps'
      }

      const mapped: ProblemRecord[] = (data || []).map((row) => ({
        id: row.applicant_id || '',
        application_no: row.application_no || (row.applicant_id ? row.applicant_id.slice(0, 8).toUpperCase() : 'N/A'),
        name: row.full_name || 'N/A',
        program: row.program_name || 'N/A',
        quota: row.quota_type || 'N/A',
        bottleneck: row.specific_bottleneck_text || 'Pending Update',
        daysPending: row.days_pending || 0,
        phone: row.mobile || '',
        type: typeMapping[row.bottleneck_category || 'STALE_APPS'] || 'Stale Apps'
      }))
      setProblems(mapped)
    } catch (err) {
      console.error(err)
      toast.error('Failed to sync problem areas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProblems()
  }, [])

  const filteredProblems = problems.filter(p => p.type === activeFilter)

  const getAgingColor = (days: number) => {
    if (days >= 8) return 'text-error font-black'
    if (days >= 4) return 'text-amber-600 font-bold'
    return 'text-blue-900 font-medium'
  }

  const handleAction = (action: string, record: ProblemRecord) => {
    if (action === 'Withdraw Seat') {
      setWithdrawTarget(record)
    } else {
        setReminderTarget(record)
    }
  }

  const confirmReminder = async () => {
    if (!reminderTarget) return
    const loader = toast.loading('Dispatching tactical reminder...')
    try {
      await problemService.logAction({
        applicantId: reminderTarget.id,
        actionType: 'REMINDER_SENT',
        bottleneckType: reminderTarget.type === 'Overdue Fees' ? 'OVERDUE_FEES' : reminderTarget.type === 'Missing Docs' ? 'MISSING_DOCS' : 'STALE_APPS',
        details: 'Official alert sent via system'
      })
      toast.success(`DISPATCHED: Official alert sent to ${reminderTarget.name}.`, { id: loader })
      fetchProblems()
    } catch (err) {
      console.error(err)
      toast.error('Failed to send reminder', { id: loader })
    } finally {
      setReminderTarget(null)
    }
  }

  const confirmWithdraw = async () => {
    if (!withdrawTarget) return
    const loader = toast.loading('Withdrawing seat allocation...')
    try {
      const { error } = await applicantService.updateApplicant(withdrawTarget.id, { status: 'WITHDRAWN' })
      if (error) throw error

      await problemService.logAction({
        applicantId: withdrawTarget.id,
        actionType: 'SEAT_WITHDRAWN',
        bottleneckType: withdrawTarget.type === 'Overdue Fees' ? 'OVERDUE_FEES' : withdrawTarget.type === 'Missing Docs' ? 'MISSING_DOCS' : 'STALE_APPS',
        details: 'Seat actively withdrawn due to SLA breach'
      })
      toast.success(`CRITICAL: ${withdrawTarget.name}'s seat has been withdrawn.`, { id: loader })
      fetchProblems()
    } catch (err) {
      console.error(err)
      toast.error('Withdrawal protocol failed.', { id: loader })
    } finally {
      setWithdrawTarget(null)
    }
  }

  return (
    <>
      <Sidebar />
      <main className="md:ml-28 min-h-screen text-left bg-slate-50/50">
        <Header />
        <div className="px-12 pb-12 space-y-10 text-left">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-8 text-left"
          >
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-error/10 text-error rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-medium">plumbing</span>
               </div>
               <h2 className="text-6xl font-satoshi font-black text-primary tracking-tighter">Problem Areas</h2>
            </div>
            <p className="text-outline font-body text-lg max-w-2xl leading-relaxed">
              Tactical <span className="text-error font-bold italic">Hit List</span> for clearing pipeline blockages and preventing hostage seats.
            </p>
          </motion.div>

          {/* Section 1: Triage Filters */}
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-2 rounded-[2rem] border border-surface-container shadow-sm w-max">
             {(['Overdue Fees', 'Missing Docs', 'Stale Apps'] as PriorityFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    activeFilter === filter 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' 
                    : 'text-outline hover:bg-slate-50 hover:text-blue-900'
                  }`}
                >
                  {filter === 'Overdue Fees' && '🔥 '}
                  {filter === 'Missing Docs' && '⚠️ '}
                  {filter === 'Stale Apps' && '⏳ '}
                  {filter}
                </button>
             ))}
          </div>

          {/* Section 2: Action Table */}
          <motion.div 
            key={activeFilter}
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-white rounded-[2.5rem] shadow-[0px_40px_80px_rgba(0,0,0,0.03)] overflow-hidden text-left"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-surface-container text-[11px] uppercase font-black text-outline tracking-[0.25em]">
                    <th className="py-8 px-10">Applicant / System ID</th>
                    <th className="py-8 px-6">Target Program</th>
                    <th className="py-8 px-6">The Bottleneck</th>
                    <th className="py-8 px-6 text-center">Aging</th>
                    <th className="py-8 px-6">Direct Contact</th>
                    <th className="py-8 px-10 text-right">Instant Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProblems.map((row, i) => (
                    <motion.tr 
                      key={row.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-primary/[0.02] transition-colors group"
                    >
                      <td className="py-8 px-10 flex items-center gap-5">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${row.daysPending >= 8 ? 'bg-error/10 text-error' : 'bg-slate-100 text-slate-400'}`}>
                            {row.name.charAt(0)}
                         </div>
                         <div>
                            <div className="font-satoshi font-black text-blue-950 text-lg">{row.name}</div>
                            <div className="text-[11px] font-black text-outline/60 uppercase tracking-widest mt-1">{row.id}</div>
                         </div>
                      </td>
                      <td className="py-8 px-6">
                         <div className="font-satoshi font-black text-sm text-blue-900">{row.program}</div>
                         <div className="text-[10px] font-black text-outline uppercase tracking-widest mt-1 opacity-70">{row.quota}</div>
                      </td>
                      <td className="py-8 px-6">
                         <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-sm ${row.type === 'Overdue Fees' ? 'bg-red-50 text-error border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                            <span className="material-symbols-outlined text-[18px]">{row.type === 'Overdue Fees' ? 'payments' : 'description'}</span>
                            {row.bottleneck}
                         </div>
                      </td>
                      <td className="py-8 px-6 text-center">
                         <div className={`text-2xl font-satoshi flex flex-col items-center ${getAgingColor(row.daysPending)}`}>
                            {row.daysPending}
                            <span className="text-[9px] uppercase tracking-widest opacity-60">Days Pending</span>
                         </div>
                      </td>
                      <td className="py-8 px-6">
                         <a href={`tel:${row.phone}`} className="flex items-center gap-3 group/phone text-blue-900 hover:text-primary transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover/phone:bg-primary/10 transition-all">
                               <span className="material-symbols-outlined text-[20px]">call</span>
                            </div>
                            <span className="font-black text-sm">{row.phone}</span>
                         </a>
                      </td>
                      <td className="py-8 px-10 text-right">
                         <div className="flex justify-end items-center gap-2 opacity-100 lg:opacity-40 group-hover:opacity-100 transition-all duration-500">
                            {activeFilter !== 'Stale Apps' && (
                                <motion.button 
                                    whileHover={{ scale: 1.05 }} 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAction('Reminder', row)}
                                    className="w-10 h-10 flex items-center justify-center bg-primary/5 text-primary rounded-xl border border-primary/10 hover:bg-primary hover:text-white transition-all shadow-sm"
                                    title="Send Quick Reminder"
                                >
                                    <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                                </motion.button>
                            )}
                            <motion.button 
                                whileHover={{ scale: 1.05 }} 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAction('Withdraw Seat', row)}
                                className="px-5 py-2.5 bg-error/5 text-error rounded-xl border border-error/10 font-bold text-[10px] uppercase tracking-[0.15em] hover:bg-error hover:text-white transition-all shadow-sm flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                                Withdraw
                            </motion.button>
                         </div>
                      </td>
                    </motion.tr>
                  ))}
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-4">
                            <span className="material-symbols-outlined text-4xl text-outline animate-spin">refresh</span>
                            <p className="font-satoshi font-black text-xl text-slate-400 uppercase tracking-widest">Scanning Pipeline...</p>
                         </div>
                      </td>
                    </tr>
                  ) : filteredProblems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-32 text-center">
                           <div className="flex flex-col items-center gap-4">
                              <span className="material-symbols-outlined text-6xl text-green-200">check_circle</span>
                              <p className="font-satoshi font-black text-2xl text-slate-300 uppercase tracking-widest">Pipeline Clear!</p>
                              <p className="text-outline text-sm">No {activeFilter.toLowerCase()} found in the system logic.</p>
                           </div>
                        </td>
                      </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </motion.div>

          <footer className="pt-10 flex border-t border-slate-100 items-center justify-between">
             <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-error animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-outline opacity-60">System running daily cleanup script • Lock interval: 24h</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline opacity-60 text-right">Record cancellations are logged for institutional audit.</p>
          </footer>
        </div>
      </main>

      {/* High-Stakes Confirmation Modal */}
      <AnimatePresence>
        {withdrawTarget && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setWithdrawTarget(null)} 
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-[8px]" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.98, y: 10 }} 
                    className="relative w-full max-w-md bg-white rounded-[2rem] shadow-[0px_32px_64px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden p-10"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-error/5 text-error rounded-2xl flex items-center justify-center mb-6 border border-error/10">
                            <span className="material-symbols-outlined text-3xl font-medium">warning</span>
                        </div>
                        
                        <h3 className="text-2xl font-satoshi font-black text-blue-950 tracking-tight leading-tight">
                            Withdraw Admission?
                        </h3>
                        
                        <p className="mt-4 text-outline font-body text-sm leading-relaxed max-w-[280px]">
                            You are about to strip <span className="font-bold text-blue-950">{withdrawTarget.name}</span> of their <span className="font-bold text-primary">{withdrawTarget.program} ({withdrawTarget.quota})</span> seat.
                        </p>

                        <div className="mt-8 w-full space-y-3">
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">sync_alt</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Seat Matrix: Returning +1 to pool</span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">history_edu</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Audit: Action logged to your profile</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 space-y-3">
                        <motion.button 
                            whileHover={{ scale: 1.01 }} 
                            whileTap={{ scale: 0.99 }}
                            onClick={confirmWithdraw}
                            className="w-full py-4 bg-error text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-error/20 flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">gavel</span>
                            Confirm Withdrawal
                        </motion.button>
                        
                        <button 
                            onClick={() => setWithdrawTarget(null)}
                            className="w-full py-4 text-outline font-black text-[10px] uppercase tracking-widest hover:text-blue-900 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            Cancel Action
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Modern Reminder Modal */}
      <AnimatePresence>
        {reminderTarget && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setReminderTarget(null)} 
                    className="absolute inset-0 bg-slate-950/40 backdrop-blur-[10px]" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.98, y: 10 }} 
                    className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-[0px_40px_80px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden"
                >
                    <div className="p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center border border-primary/10">
                                <span className="material-symbols-outlined text-3xl">notifications_active</span>
                            </div>
                            <div className="px-4 py-1 bg-amber-50 rounded-full border border-amber-100 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">High Priority</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-satoshi font-black text-blue-950 tracking-tight leading-tight">
                                Dispatch Reminder
                            </h3>
                            <p className="mt-4 text-outline font-body text-sm leading-relaxed">
                                Sending an automated alert to <span className="font-bold text-blue-950">{reminderTarget.name}</span> regarding <span className="font-bold text-primary italic underline underline-offset-4 decoration-primary/30">{reminderTarget.bottleneck}</span>.
                            </p>
                        </div>

                        <div className="pt-2 space-y-3">
                            <motion.button 
                                whileHover={{ scale: 1.01 }} 
                                whileTap={{ scale: 0.99 }}
                                onClick={confirmReminder}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:bg-blue-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">send</span>
                                Confirm & Dispatch Alert
                            </motion.button>
                            <button 
                                onClick={() => setReminderTarget(null)}
                                className="w-full py-4 text-outline font-black text-[10px] uppercase tracking-widest hover:text-blue-900 transition-colors"
                            >
                                Not Now, Cancel
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
