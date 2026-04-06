import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { problemService } from '../services/problemService'

const DefaulterPendingList = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data: res } = await problemService.getProblemAreas()
        if (isMounted) setData(res || [])
      } catch (err) {
        console.error("Failed to fetch problems", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [])

  const feeDefaulters = data.filter(d => d.bottleneck_category === 'OVERDUE_FEES')
  const docPending = data.filter(d => d.bottleneck_category === 'MISSING_DOCS' || d.bottleneck_category === 'STALE_APPS')

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-12 bg-surface-container-lowest p-10 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white flex flex-col"
    >
      <h3 className="text-2xl font-satoshi font-black mb-10 flex items-center gap-3">
        <span className="material-symbols-outlined text-error text-[28px]" data-icon="warning">warning</span>
        Problem Areas Focus
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 flex-1">
        <div>
          <h4 className="text-sm font-label font-bold uppercase tracking-widest text-outline mb-6">Fee Defaulter List</h4>
          <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-left font-body">
            <thead>
              <tr className="text-[10px] font-label font-black uppercase text-outline/60 border-b border-surface">
                <th className="py-3">Name</th>
                <th className="py-3">Program</th>
                <th className="py-3">Quota</th>
                <th className="py-3 text-right">Days Overdue</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center animate-pulse text-outline">Loading...</td></tr>
              ) : feeDefaulters.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-outline italic">No critical defaults identified.</td></tr>
              ) : feeDefaulters.map((row, i) => (
                <tr key={i} className="border-b border-surface/50 last:border-0 hover:bg-surface-container-low transition-colors group">
                  <td className="py-4 font-medium text-on-surface">{row.full_name}</td>
                  <td className="py-4 text-outline">{row.program_name?.slice(0, 4).toUpperCase()}</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 bg-surface-container rounded-md text-[10px] uppercase font-bold text-outline tracking-wider">{row.quota_type}</span>
                  </td>
                  <td className="py-4 text-right font-bold text-error">{row.days_pending} Days</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-label font-bold uppercase tracking-widest text-outline mb-6">Process Bottlenecks</h4>
          <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-left font-body">
            <thead>
              <tr className="text-[10px] font-label font-black uppercase text-outline/60 border-b border-surface">
                <th className="py-3">Name</th>
                <th className="py-3">Missing/Stale Info</th>
                <th className="py-3 text-right">Aging</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={3} className="py-8 text-center animate-pulse text-outline">Loading...</td></tr>
              ) : docPending.length === 0 ? (
                <tr><td colSpan={3} className="py-8 text-center text-outline italic">Pipeline clear.</td></tr>
              ) : docPending.map((row, i) => (
                <tr key={i} className="border-b border-surface/50 last:border-0 hover:bg-surface-container-low transition-colors group">
                  <td className="py-4 font-medium text-on-surface">{row.full_name}</td>
                  <td className="py-4">
                    <span className="text-error text-xs font-bold bg-error-container/30 px-2 py-0.5 rounded-md mt-[2px]">
                      {row.specific_bottleneck_text || 'Document Verification Pending'}
                    </span>
                  </td>
                  <td className="py-4 text-right text-xs font-bold text-outline">{row.days_pending}d</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export const ProblemAreas = () => {
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
              <h2 className="text-6xl font-satoshi font-black text-primary tracking-tighter">Problem Areas</h2>
              <p className="text-outline mt-3 font-body text-lg max-w-lg leading-relaxed">Action required for pending clearances and fee default accounts.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-12 gap-8">
            <DefaulterPendingList />
          </div>
        </div>
      </main>
    </>
  )
}
