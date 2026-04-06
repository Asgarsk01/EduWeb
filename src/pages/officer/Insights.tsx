import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Header } from '../../components/Header'
import { Sidebar } from '../../components/Sidebar'
import { analyticsService } from '../../services/analyticsService'
import { problemService } from '../../services/problemService'
import { rulebookService } from '../../services/rulebookService'
import { aiService } from '../../services/aiService'
import { toast } from 'react-hot-toast'
import type { AdmissionVelocity, QuotaDistribution } from '../../types/analytics.types'

const AdmissionVelocityPace = ({ data, loading }: { data: AdmissionVelocity[], loading: boolean }) => {
  const chartData = data.slice(-6).map(d => ({
    day: new Date(d.admission_date).toLocaleDateString(undefined, { weekday: 'short' }),
    h2: `${Math.min(100, (d.confirmed_count / 10) * 100)}%`
  }))

  const lastCount = data[data.length - 1]?.confirmed_count || 0
  const prevCount = data[data.length - 2]?.confirmed_count || 0
  const trend = prevCount > 0 ? Math.round(((lastCount - prevCount) / prevCount) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-12 bg-surface-container-lowest p-10 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white flex flex-col"
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-2xl font-satoshi font-black">Admission Velocity</h3>
          <p className="text-xs font-medium text-outline mt-1">Confirmed Admissions (Current Cycle)</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-label font-bold uppercase tracking-widest text-outline">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary/30"></span> Baseline</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Current</div>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-outline animate-pulse font-satoshi">Analyzing velocity patterns...</div>
      ) : (
        <div className="flex-1 min-h-[160px] flex items-end justify-between gap-2 mt-4 relative pb-6 border-b border-surface">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 pb-6">
            <div className="border-b border-surface border-dashed w-full h-0"></div>
            <div className="border-b border-surface border-dashed w-full h-0"></div>
            <div className="border-b border-surface border-dashed w-full h-0"></div>
            <div className="border-b border-surface border-dashed w-full h-0"></div>
          </div>
          {chartData.length === 0 ? (
             <div className="absolute inset-0 flex items-center justify-center text-outline text-xs italic">Awaiting confirmation telemetry...</div>
          ) : chartData.map((col, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group z-10">
              <div className="flex items-end justify-center w-full h-full gap-1">
                <motion.div initial={{ height: 0 }} animate={{ height: '30%' }} className="w-[30%] max-w-[24px] bg-primary/30 rounded-t-md group-hover:bg-primary/50 transition-colors"></motion.div>
                <motion.div initial={{ height: 0 }} animate={{ height: col.h2 }} className="w-[30%] max-w-[24px] bg-primary rounded-t-md shadow-[0_0_12px_rgba(37,99,235,0.2)] group-hover:bg-blue-700 transition-colors"></motion.div>
              </div>
              <span className="text-[10px] font-label font-bold text-outline absolute bottom-0 translate-y-[100%] pt-2">{col.day}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-10 pt-2 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest">Velocity Pace</p>
          <p className="text-3xl font-satoshi font-black mt-1 flex items-center gap-3">
            {trend >= 0 ? 'Ahead of Schedule' : 'Pacing Behind'}
            <span className={`text-xs font-bold ${trend >= 0 ? 'text-primary bg-primary/10' : 'text-error bg-error/10'} px-2 py-0.5 rounded-md inline-flex items-center gap-1`}>
              <span className="material-symbols-outlined text-[14px]" data-icon={trend >= 0 ? "trending_up" : "trending_down"}>{trend >= 0 ? "trending_up" : "trending_down"}</span>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-2">Scope</p>
          <span className="text-[11px] font-black uppercase tracking-wider text-secondary bg-secondary-container px-3 py-1.5 rounded-full border border-secondary/20">All Campuses</span>
        </div>
      </div>
    </motion.div>
  )
}

const AISmartAlerts = ({ alerts, loading }: { alerts: string[], loading: boolean }) => {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false)

  const processedAlerts = alerts.map((alert, i) => ({
      type: i === 0 ? 'urgent' : i === 1 ? 'tip' : 'info',
      icon: i === 0 ? 'crisis_alert' : i === 1 ? 'lightbulb' : 'trending_up',
      title: i === 0 ? 'Critical Focus' : i === 1 ? 'Tactical Tip' : 'Pipeline Alert',
      desc: alert,
      time: 'Live',
      color: i === 0 ? 'text-error' : i === 1 ? 'text-amber-600' : 'text-primary',
      bg: i === 0 ? 'bg-error/10' : i === 1 ? 'bg-amber-100' : 'bg-primary/10'
  }))

  if (loading) {
     return (
        <div className="col-span-12 bg-surface-container-lowest p-6 rounded-2xl border border-white animate-pulse flex items-center gap-6">
            <div className="w-12 h-12 bg-surface-container rounded-xl"></div>
            <div className="h-4 bg-surface-container w-full max-w-lg rounded"></div>
        </div>
     )
  }

  const primaryAlert = processedAlerts[0] || { icon: 'info', bg: 'bg-surface-container', color: 'text-outline', title: 'Awaiting data', desc: 'Analyzing current bottlenecks...' }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="col-span-12 bg-surface-container-lowest p-6 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="flex items-center gap-6">
          <div className={`w-12 h-12 ${primaryAlert.bg} ${primaryAlert.color} rounded-xl flex items-center justify-center shrink-0`}>
            <span className="material-symbols-outlined text-[24px]" data-icon={primaryAlert.icon}>{primaryAlert.icon}</span>
          </div>
          <div>
            <h4 className="font-satoshi font-black text-lg text-on-surface flex items-center gap-2">
              {primaryAlert.title}: {primaryAlert.desc} 
              <span className="text-[10px] px-2 py-0.5 rounded bg-error/10 text-error uppercase tracking-widest font-bold">AI Active</span>
            </h4>
            <p className="text-sm font-medium text-outline mt-1 max-w-2xl">Generated based on latest problem area telemetry.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAlertsOpen(true)} 
          className="flex items-center justify-center gap-2 text-xs font-bold text-primary hover:text-blue-700 px-4 py-2 rounded-full transition-all shrink-0 hover:bg-primary/5 cursor-pointer"
        >
          View All Alerts <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
        </button>
      </motion.div>

      <AnimatePresence>
        {isAlertsOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setIsAlertsOpen(false)} 
                    className="absolute inset-0 bg-slate-950/40 backdrop-blur-[8px]" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.98, y: 10 }} 
                    className="relative w-full max-w-2xl bg-surface-container-lowest rounded-[2rem] shadow-[0px_40px_80px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
                >
                    <div className="p-8 border-b border-surface/60 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-satoshi font-black text-blue-950">AI Tactical Coach</h3>
                            <p className="text-xs font-medium text-outline mt-1">Short-term actionable alerts</p>
                        </div>
                        <button onClick={() => setIsAlertsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface hover:bg-surface-container text-outline transition-colors">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto p-4 flex-1">
                        {processedAlerts.map((alert, i) => (
                            <div key={i} className="flex gap-5 p-5 group hover:bg-surface transition-colors rounded-2xl border-b border-transparent hover:border-surface-container">
                                <div className={`w-12 h-12 ${alert.bg} ${alert.color} rounded-xl flex items-center justify-center shrink-0`}>
                                    <span className="material-symbols-outlined text-[24px]">{alert.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h5 className="font-satoshi font-black text-blue-950 text-[15px]">{alert.title}</h5>
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-green-600">Live</span>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-outline leading-relaxed">{alert.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </>
  )
}

const PersonalFunnelDropoff = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-10 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white flex flex-col"
    >
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-satoshi font-black">Personal Funnel Drop-off</h3>
          <p className="text-xs font-medium text-outline mt-1">Your localized conversion pipeline</p>
        </div>
        <div className="flex items-center gap-1 text-secondary font-bold text-[10px] bg-secondary-container/30 border border-secondary/10 px-3 py-1 rounded-full uppercase tracking-widest">
           My Data Only
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-6">
        {[
          { label: 'Total Leads Created', count: 124, width: '100%', baseBg: 'bg-surface-container', fillBg: 'bg-surface', textClr: 'text-outline' },
          { label: 'Seats Locked', count: 85, width: '70%', baseBg: 'secondary-container', fillBg: 'bg-secondary/40', textClr: 'text-secondary' },
          { label: 'Fees Paid', count: 42, width: '40%', baseBg: 'primary/20', fillBg: 'bg-primary/60', textClr: 'text-primary' },
          { label: 'Confirmed Admissions', count: 35, width: '30%', baseBg: 'primary/20', fillBg: 'bg-primary', textClr: 'text-primary' }
        ].map((step, i) => (
             <div key={i} className="space-y-2">
                 <div className="flex justify-between text-[11px] font-label font-bold uppercase tracking-widest text-on-surface">
                     <span>{step.label}</span>
                     <span>{step.count}</span>
                 </div>
                 <div className="w-full h-8 bg-surface-container-lowest border border-surface rounded-md overflow-hidden relative">
                     <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: step.width }}
                        viewport={{ once: true }}
                        className={`absolute left-0 top-0 bottom-0 ${step.fillBg}`}
                    />
                 </div>
             </div>
        ))}
      </div>
      <div className="mt-8 pt-6 border-t border-surface/50">
        <p className="text-sm font-medium text-outline flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-500">lightbulb</span>
            <span>You have a high drop-off rate at the <span className="font-bold text-on-surface">Fee Payment</span> stage. Follow up actively on missing partials.</span>
        </p>
      </div>
    </motion.div>
  )
}

const TrendTracker = ({ data, loading }: { data: QuotaDistribution[], loading: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-10 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white flex flex-col"
    >
      <div className="mb-10 flex justify-between items-start">
        <div>
           <h3 className="text-2xl font-satoshi font-black">Segment Velocity</h3>
           <p className="text-xs font-medium text-outline mt-1">Trending programs across the campus</p>
        </div>
        <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] bg-green-50 border border-green-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
           </span>
           Live View
        </div>
      </div>
      
      <div className="flex-1 space-y-2">
          {loading ? (
             <div className="h-40 flex items-center justify-center text-outline animate-pulse">Syncing segment yield...</div>
          ) : (
            <div className="overflow-x-auto h-full">
               <table className="w-full text-left font-body">
                <thead>
                  <tr className="text-[10px] font-label font-black uppercase text-outline tracking-[0.15em] border-b border-surface">
                    <th className="py-2 pb-4">Program / Quota</th>
                    <th className="py-2 pb-4 pl-4">Fill Percentage</th>
                    <th className="py-2 pb-4 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {data.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-outline">No segment data.</td></tr>
                  ) : data.slice(0, 4).flatMap(row => {
                    const segments = [];
                    if (row.kcet_quota) segments.push({ name: `${row.program_name} (KCET)`, total: row.kcet_quota, filled: row.kcet_filled });
                    if (row.comedk_quota) segments.push({ name: `${row.program_name} (COMEDK)`, total: row.comedk_quota, filled: row.comedk_filled });
                    if (row.management_quota) segments.push({ name: `${row.program_name} (MGMT)`, total: row.management_quota, filled: row.management_filled });
                    return segments.slice(0, 1); // Just show one significant segment per program for brevity
                  }).map((seg, idx) => {
                    const pct = seg.total ? Math.round(((seg.filled || 0) / seg.total) * 100) : 0;
                    const isPositive = pct > 50;

                    return (
                    <tr key={idx} className="border-b border-surface/50 last:border-0 group transition-colors">
                      <td className="py-5 font-satoshi font-black text-on-surface text-xs">{seg.name}</td>
                      <td className="py-5 w-1/3 pl-4">
                         <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full ${isPositive ? 'bg-primary' : 'bg-secondary'} rounded-r-md`}></motion.div>
                         </div>
                      </td>
                      <td className="py-5 text-right font-medium">
                         <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-primary' : 'text-secondary'} text-xs font-bold`}>
                             <span className="material-symbols-outlined text-[14px]">{isPositive ? 'trending_up' : 'trending_flat'}</span>
                             {isPositive ? 'Strong' : 'Stable'}
                         </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </motion.div>
  )
}

export const Insights = () => {
  const [velocity, setVelocity] = useState<AdmissionVelocity[]>([])
  const [quotaData, setQuotaData] = useState<QuotaDistribution[]>([])
  const [alerts, setAlerts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const year = await rulebookService.getActiveAcademicYear()
      if (year.data) {
        const velData = await analyticsService.getAdmissionVelocity(year.data.id)
        setVelocity(velData)
      }
      
      const qData = await analyticsService.getQuotaDistribution()
      setQuotaData(qData)
      
    } catch (err) {
      console.error('Failed to fetch officer insights:', err)
      toast.error('Failed to load operations data.')
    } finally {
      setLoading(false)
    }
  }, [])

  const generateAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true)
      const { data: problems } = await problemService.getProblemAreas()
      if (problems && problems.length > 0) {
        const aiAlerts = await aiService.generateOfficerAlerts(problems)
        setAlerts(aiAlerts)
      } else {
        setAlerts([
          "No critical bottlenecks detected by AI.",
          "Keep monitorizing standard pipeline.",
          "Good work on document clearance."
        ])
      }
    } catch (err) {
      setAlerts([
        "Follow up on overdue CSE fees.",
        "Check documentation backlog.",
        "Review stale seat locks."
      ])
    } finally {
      setAlertsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    generateAlerts()
  }, [generateAlerts])

  return (
    <>
      <Sidebar />
      <main className="md:ml-28 min-h-screen">
        <Header />
        <div className="px-12 pb-12 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-between items-end pt-4"
          >
            <div>
              <h2 className="text-6xl font-satoshi font-black text-primary tracking-tighter">Insights</h2>
              <p className="text-outline mt-3 font-body text-lg max-w-lg leading-relaxed">Velocity pacing and localized performance tracking.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-12 gap-8">
            <AISmartAlerts alerts={alerts} loading={alertsLoading} />
            <AdmissionVelocityPace data={velocity} loading={loading} />
            <PersonalFunnelDropoff />
            <TrendTracker data={quotaData} loading={loading} />
          </div>
        </div>
      </main>
    </>
  )
}
