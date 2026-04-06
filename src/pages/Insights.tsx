import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { analyticsService } from '../services/analyticsService'
import { aiService } from '../services/aiService'
import { rulebookService } from '../services/rulebookService'
import { toast } from 'react-hot-toast'
import type { AdmissionVelocity, QuotaDistribution } from '../types/analytics.types'

const AdmissionTimelineChart = ({ data, loading }: { data: AdmissionVelocity[], loading: boolean }) => {
  const chartData = data.slice(-6).map(d => ({
    day: new Date(d.admission_date).toLocaleDateString(undefined, { weekday: 'short' }),
    h2: `${Math.min(100, (d.confirmed_count / 10) * 100)}%`, // Simplified scale for visual
    count: d.confirmed_count
  }))

  const totalConfirmed = data.reduce((acc, d) => acc + d.confirmed_count, 0)
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
          <p className="text-xs font-medium text-outline mt-1">Confirmed count per interval</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-label font-bold uppercase tracking-widest text-outline">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary/30"></span> Historic Avg</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Current Cycle</div>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-outline animate-pulse font-satoshi">Plotting temporal trajectories...</div>
      ) : (
        <div className="flex-1 min-h-[160px] flex items-end justify-between gap-2 mt-4 relative pb-6 border-b border-surface">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 pb-6">
            <div className="border-b border-surface border-dashed w-full h-0"></div>
            <div className="border-b border-surface border-dashed w-full h-0"></div>
            <div className="border-b border-surface border-dashed w-full h-0"></div>
            <div className="border-b border-surface border-dashed w-full h-0"></div>
          </div>
          {chartData.length === 0 ? (
             <div className="absolute inset-0 flex items-center justify-center text-outline text-xs italic">Waiting for initial admissions feedback...</div>
          ) : chartData.map((col, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group z-10">
              <div className="flex items-end justify-center w-full h-full gap-1">
                <motion.div initial={{ height: 0 }} animate={{ height: '20%' }} className="w-[30%] max-w-[24px] bg-primary/30 rounded-t-md group-hover:bg-primary/50 transition-colors"></motion.div>
                <motion.div initial={{ height: 0 }} animate={{ height: col.h2 }} className="w-[30%] max-w-[24px] bg-primary rounded-t-md shadow-[0_0_12px_rgba(37,99,235,0.2)] group-hover:bg-blue-700 transition-colors"></motion.div>
              </div>
              <span className="text-[10px] font-label font-bold text-outline absolute bottom-0 translate-y-[100%] pt-2">{col.day}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-10 pt-2 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest">Total Cycle Confirmed</p>
          <p className="text-3xl font-satoshi font-black mt-1 flex items-center gap-3">
            {totalConfirmed}
            <span className={`text-xs font-bold ${trend >= 0 ? 'text-primary bg-primary/10' : 'text-error bg-error/10'} px-2 py-0.5 rounded-md inline-flex items-center gap-1`}>
              <span className="material-symbols-outlined text-[14px]" data-icon={trend >= 0 ? "trending_up" : "trending_down"}>{trend >= 0 ? "trending_up" : "trending_down"}</span>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-2">Cycle Pacing</p>
          <span className={`text-[11px] font-black uppercase tracking-wider ${trend >= 0 ? 'text-secondary bg-secondary-container' : 'text-error bg-error-container'} px-3 py-1.5 rounded-full border border-current opacity-80`}>
            {trend > 10 ? 'Accelerating' : trend > 0 ? 'Optimal' : trend > -10 ? 'At Baseline' : 'Decelerating'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

const AIPrediction = ({ data, loading }: { data: QuotaDistribution[], loading: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="col-span-12 bg-surface-container-lowest p-10 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <h3 className="text-2xl font-satoshi font-black">Capacity Prediction Matrix</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-[10px] font-label text-secondary font-black uppercase tracking-[0.2em] hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            Real-time Pipeline
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="py-20 text-center text-outline animate-pulse font-satoshi">Crunching pipeline variables...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead>
              <tr className="text-[10px] font-label font-black uppercase text-outline tracking-[0.15em] border-b border-surface">
                <th className="py-2 pb-6">Program</th>
                <th className="py-2 pb-6">Quota</th>
                <th className="py-2 pb-6 text-center">% Occupied</th>
                <th className="py-2 pb-6">Available</th>
                <th className="py-2 pb-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-outline italic">No capacity metrics available yet.</td></tr>
              ) : data.map((row, idx) => {
                const total = (row.kcet_quota || 0) + (row.comedk_quota || 0) + (row.management_quota || 0);
                const occupied = (row.kcet_filled || 0) + (row.management_filled || 0) + (row.comedk_filled || 0);
                const vacant = total - occupied;
                const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;
                const status = percent > 90 ? 'Critical' : percent > 75 ? 'Watch' : 'On Track';
                const statusColor = percent > 90 ? 'bg-error-container text-error' : percent > 75 ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-secondary-container text-secondary';
                
                return (
                  <motion.tr key={idx} whileHover={{ backgroundColor: "var(--color-surface-container-low)" }} className="border-t border-surface/50 group transition-colors">
                    <td className="py-6 font-satoshi font-black text-blue-950">{row.program_name}</td>
                    <td className="py-6 text-outline">Combined Quotas</td>
                    <td className="py-6 text-center font-black text-lg">{percent}%</td>
                    <td className="py-6 text-outline font-medium">{vacant} Seats</td>
                    <td className="py-6 text-right">
                      <span className={`px-4 py-1.5 ${statusColor} rounded-full text-[10px] font-black uppercase tracking-widest`}>
                        {status}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

const AIFullBriefing = ({ briefing, loading, onRegenerate }: { briefing: string, loading: boolean, onRegenerate: () => void }) => {
  const paragraphs = briefing.split('\n\n').filter(p => p.trim())

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-12 bg-surface-container-lowest p-10 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white"
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]" data-icon="auto_awesome">auto_awesome</span>
          </div>
          <div>
            <h3 className="text-2xl font-satoshi font-black">AI Full Briefing</h3>
            <p className="text-sm font-medium text-outline mt-1">Tactical narrative generated from live PostgreSQL telemetry.</p>
          </div>
        </div>
        <button 
          onClick={onRegenerate}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 px-4 py-2 rounded-full transition-all w-max disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`} data-icon="refresh">refresh</span>
          {loading ? 'Analyzing...' : 'Regenerate Briefing'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_0.9fr] gap-8">
        <div className={`rounded-[1.75rem] bg-surface p-7 border border-surface-container min-h-[300px] transition-all ${loading ? 'animate-pulse opacity-60' : ''}`}>
          <p className="text-[11px] font-label font-black uppercase tracking-[0.24em] text-outline mb-4">The Narrative</p>
          <div className="space-y-4 text-[15px] leading-8 text-on-surface font-medium">
            {loading ? (
                <div className="space-y-4">
                    <div className="h-4 bg-surface-container w-full rounded"></div>
                    <div className="h-4 bg-surface-container w-[90%] rounded"></div>
                    <div className="h-4 bg-surface-container w-[95%] rounded"></div>
                    <div className="h-4 bg-surface-container w-[80%] rounded"></div>
                </div>
            ) : paragraphs.length > 0 ? (
                paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
                <p className="text-outline italic">No narrative briefing generated yet. Click regenerate to initiate AI analysis.</p>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-primary text-white p-7 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-label font-black uppercase tracking-[0.24em] text-white/55 mb-4">Command Focus</p>
            <div className="space-y-4">
              <div>
                <p className="font-satoshi text-3xl font-black">Live</p>
                <p className="text-sm text-white/80 mt-1">Operational bottlenecks mapped to AI nodes.</p>
              </div>
              <div className="h-px bg-white/10"></div>
              <div className="space-y-3 text-sm text-white/85">
                <p>Prioritize high-yield program conversions.</p>
                <p>Monitor management quota shelf-life.</p>
                <p>Escalate stale document verification clusters.</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2 text-secondary-container text-xs font-black uppercase tracking-[0.18em]">
            <span className="material-symbols-outlined text-[16px]" data-icon="tips_and_updates">tips_and_updates</span>
            AI Integration Active
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export const Insights = () => {
  const [velocity, setVelocity] = useState<AdmissionVelocity[]>([])
  const [quotaData, setQuotaData] = useState<QuotaDistribution[]>([])
  const [briefing, setBriefing] = useState("")
  const [loading, setLoading] = useState(true)
  const [briefingLoading, setBriefingLoading] = useState(false)

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
      console.error('Failed to fetch insights:', err)
      toast.error('Failed to sync metrics from HQ.')
    } finally {
      setLoading(false)
    }
  }, [])

  const generateBriefing = useCallback(async () => {
    if (quotaData.length === 0) return
    try {
      setBriefingLoading(true)
      const kpis = await analyticsService.getManagementKPIs()
      const progress = await analyticsService.getProgramProgress()
      const text = await aiService.generateManagementBriefing(kpis, progress)
      setBriefing(text)
    } catch (err: any) {
      setBriefing(err.message || "AI Insights temporarily unavailable.")
    } finally {
      setBriefingLoading(false)
    }
  }, [quotaData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (quotaData.length > 0 && !briefing) {
      generateBriefing()
    }
  }, [quotaData, briefing, generateBriefing])

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
              <p className="text-outline mt-3 font-body text-lg max-w-lg leading-relaxed">AI projections and temporal admission analysis.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-12 gap-8">
            <AdmissionTimelineChart data={velocity} loading={loading} />
            <AIPrediction data={quotaData} loading={loading} />
            <AIFullBriefing briefing={briefing} loading={briefingLoading} onRegenerate={generateBriefing} />
          </div>
        </div>
      </main>
    </>
  )
}
