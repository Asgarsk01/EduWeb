import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '../../components/Header'
import { Sidebar } from '../../components/Sidebar'
import { rulebookService } from '../../services/rulebookService'
import { masterService } from '../../services/masterService'
import { toast } from 'react-hot-toast'
import type { SeatMatrix as SeatRecord, AcademicYear } from '../../types/rulebook.types'
import type { Campus, Department } from '../../types/master.types'

// Extended type for UI with joined data
interface ExtendedSeatRecord extends SeatRecord {
  programs: {
    id: string
    name: string
    code: string
    campus_id: string
    department_id: string
    campuses: { name: string }
  }
}

export const SeatMatrix = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState<ExtendedSeatRecord | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Data lists
  const [matrices, setMatrices] = useState<ExtendedSeatRecord[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // Selection states
  const [activeYearId, setActiveYearId] = useState<string>('')
  const [selectedCampusId, setSelectedCampusId] = useState<string>('')
  const [selectedDeptId, setSelectedDeptId] = useState<string>('')

  // Modal Input states
  const [total, setTotal] = useState<number | ''>(0)
  const [kcet, setKcet] = useState<number | ''>(0)
  const [comedk, setComedk] = useState<number | ''>(0)
  const [mgmt, setMgmt] = useState<number | ''>(0)

  // Fetch initial data (Lists for dropdowns)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [yrs, camps, depts] = await Promise.all([
          rulebookService.getAcademicYears(),
          masterService.getCampuses(),
          masterService.getDepartments()
        ])
        
        setAcademicYears(yrs.data || [])
        setCampuses(camps.data || [])
        setDepartments(depts.data || [])
        
        const currentActive = yrs.data?.find(y => y.is_active)
        if (currentActive) setActiveYearId(currentActive.id)
      } catch (err) {
        console.error(err)
        toast.error('Failed to synchronize architectural metadata')
      }
    }
    fetchMetadata()
  }, [])

  // Fetch Matrices based on filters
  const fetchMatrices = useCallback(async () => {
    if (!activeYearId) return
    try {
      setLoading(true)
      const { data, error } = await rulebookService.getSeatMatrices({
        academicYearId: activeYearId,
        campusId: selectedCampusId || undefined,
        departmentId: selectedDeptId || undefined
      })
      if (error) throw error
      setMatrices((data as unknown as ExtendedSeatRecord[]) || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to synchronize allocation registry')
    } finally {
      setLoading(false)
    }
  }, [activeYearId, selectedCampusId, selectedDeptId])

  useEffect(() => {
    fetchMatrices()
  }, [fetchMatrices])

  const openModal = (matrix: ExtendedSeatRecord) => {
    setSelectedSeat(matrix)
    setTotal(matrix.total_intake)
    setKcet(matrix.kcet_quota)
    setComedk(matrix.comedk_quota)
    setMgmt(matrix.management_quota)
    setIsModalOpen(true)
  }

  // Real-time Math Logic for Modal
  const numTotal = Number(total) || 0
  const numKcet = Number(kcet) || 0
  const numComedk = Number(comedk) || 0
  const numMgmt = Number(mgmt) || 0
  
  const sumQuotas = numKcet + numComedk + numMgmt
  const remainingSeats = numTotal - sumQuotas
  
  // Floor validation based on locked seats
  const isKcetTooLow = numKcet < (selectedSeat?.kcet_locked || 0)
  const isComedkTooLow = numComedk < (selectedSeat?.comedk_locked || 0)
  const isMgmtTooLow = numMgmt < (selectedSeat?.management_locked || 0)
  
  const isMathValid = remainingSeats === 0
  const canSave = isMathValid && !isKcetTooLow && !isComedkTooLow && !isMgmtTooLow && total !== ''

  const handleSaveMatrix = async () => {
    if (!canSave || !selectedSeat) return
    const loader = toast.loading('Calculating and committing quota shifts...')
    try {
      const { error } = await rulebookService.updateSeatMatrix(selectedSeat.id, {
        total_intake: numTotal,
        kcet_quota: numKcet,
        comedk_quota: numComedk,
        management_quota: numMgmt
      })
      if (error) throw error
      toast.success('Matrix realignment successful', { id: loader })
      setIsModalOpen(false)
      fetchMatrices()
    } catch (err) {
      console.error(err)
      toast.error('Protocol rejected: Quota integrity check failed', { id: loader })
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
                <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-sm">Allocation Engine</span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest rounded-sm italic">
                  {academicYears.find(y => y.id === activeYearId)?.year_string || 'Target: Pending'}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-satoshi font-black text-slate-900 tracking-tighter">Seat Matrix Configuration</h2>
              <p className="text-slate-500 font-body text-base font-medium max-w-2xl leading-relaxed">
                The mathematical rulebook. Define approved intake quotas. The backend relies entirely on these limits for admissions and dashboard telemetry.
              </p>
            </div>
          </motion.div>

          {/* Context Selectors */}
          <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-end font-body">
            <div className="space-y-2 flex-1">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Target Context</label>
              <select 
                value={activeYearId}
                onChange={(e) => setActiveYearId(e.target.value)}
                className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900"
              >
                <option value="">Select Target Year</option>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.year_string} {y.is_active ? '(Active)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Select Campus</label>
              <select 
                value={selectedCampusId}
                onChange={(e) => setSelectedCampusId(e.target.value)}
                className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900"
              >
                <option value="">All Regions</option>
                {campuses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Select Department</label>
              <select 
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-5 py-4 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-slate-900"
              >
                <option value="">Across All Schools</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Seat Matrix Grid */}
          <div className="grid grid-cols-1 gap-12 text-left pt-2">
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-1">
              <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg md:text-xl">grid_view</span>
                  <h3 className="font-satoshi text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Allocation Registry</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                  {loading ? 'Recalculating quotas...' : `Active Nodes: ${matrices.length}`}
                </span>
              </div>
              <table className="w-full text-left font-body">
                <thead>
                  <tr className="border-b border-slate-50 bg-white">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Program Name</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Intake Cap</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-primary">KCET Node</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-blue-600">COMEDK Node</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-amber-600">MGMT Node</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Math Check</th>
                    <th className="px-8 py-6"></th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-24 text-center">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : matrices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-24 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">No allocation nodes found for this context</p>
                      </td>
                    </tr>
                  ) : matrices.map((matrix) => {
                    const rowSum = matrix.kcet_quota + matrix.comedk_quota + matrix.management_quota
                    const isMathCorrect = rowSum === matrix.total_intake

                    return (
                      <tr key={matrix.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-7">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 uppercase tracking-tight">{matrix.programs?.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-0.5 italic">{matrix.programs?.campuses?.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-7 font-mono font-bold text-slate-900">{matrix.total_intake}</td>
                        <td className="px-8 py-7 font-mono font-bold text-primary">
                          {matrix.kcet_quota}
                          <span className="text-[10px] block opacity-40 font-bold ml-1 font-body">Used: {matrix.kcet_locked}</span>
                        </td>
                        <td className="px-8 py-7 font-mono font-bold text-blue-600">
                          {matrix.comedk_quota}
                          <span className="text-[10px] block opacity-40 font-bold ml-1 font-body">Used: {matrix.comedk_locked}</span>
                        </td>
                        <td className="px-8 py-7 font-mono font-bold text-amber-600">
                          {matrix.management_quota}
                          <span className="text-[10px] block opacity-40 font-bold ml-1 font-body">Used: {matrix.management_locked}</span>
                        </td>
                        <td className="px-8 py-7">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-black/5 ${isMathCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {isMathCorrect ? 'SYNC ✅' : 'ERROR 🔴'}
                          </div>
                        </td>
                        <td className="px-8 py-7 text-right">
                          <button 
                            onClick={() => openModal(matrix)}
                            className="bg-white text-slate-900 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                          >
                            Reconfigure
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Configuration Modal */}
      <AnimatePresence>
        {isModalOpen && selectedSeat && (
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
                    <h3 className="text-2xl font-satoshi font-black tracking-tight leading-none uppercase italic">Manage Quota Splits</h3>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-3">{selectedSeat.programs?.name}</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">close</button>
                </div>
              </div>

              <div className="p-10 space-y-8 bg-slate-50/30 font-body">
                {/* Master Input */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Total System Cap</label>
                  </div>
                  <input 
                    type="number" min="0" 
                    value={total} onChange={e => setTotal(e.target.valueAsNumber || '')}
                    className="w-full px-5 py-5 rounded-md border border-slate-200 bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-satoshi font-black text-4xl text-slate-900 text-center shadow-xl shadow-slate-100" 
                  />
                </div>

                <div className="h-px bg-slate-200"></div>

                {/* Splitting Inputs */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-primary ml-1 block text-center">KCET Quota</label>
                    <input 
                      type="number" min="0" 
                      value={kcet} onChange={e => setKcet(e.target.valueAsNumber || '')}
                      className={`w-full px-4 py-4 rounded-md border bg-white focus:outline-none transition-all font-mono font-bold text-xl text-slate-900 text-center ${isKcetTooLow ? 'border-red-400 text-red-600' : 'border-slate-200'}`} 
                    />
                    <div className="text-[9px] font-bold text-slate-400 uppercase text-center italic">Locked: {selectedSeat.kcet_locked}</div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 ml-1 block text-center">COMEDK Quota</label>
                    <input 
                      type="number" min="0" 
                      value={comedk} onChange={e => setComedk(e.target.valueAsNumber || '')}
                      className={`w-full px-4 py-4 rounded-md border bg-white focus:outline-none transition-all font-mono font-bold text-xl text-slate-900 text-center ${isComedkTooLow ? 'border-red-400 text-red-600' : 'border-slate-200'}`} 
                    />
                    <div className="text-[9px] font-bold text-slate-400 uppercase text-center italic">Locked: {selectedSeat.comedk_locked}</div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 ml-1 block text-center">MGMT Quota</label>
                    <input 
                      type="number" min="0" 
                      value={mgmt} onChange={e => setMgmt(e.target.valueAsNumber || '')}
                      className={`w-full px-4 py-4 rounded-md border bg-white focus:outline-none transition-all font-mono font-bold text-xl text-center ${isMgmtTooLow ? 'border-red-400 text-red-600' : 'border-slate-200'}`} 
                    />
                    <div className="text-[9px] font-bold text-slate-400 uppercase text-center italic">Locked: {selectedSeat.management_locked}</div>
                  </div>
                </div>

                {/* Live Remaining Badge */}
                <div className="flex justify-center pt-2">
                   <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                      remainingSeats === 0 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                   }`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${remainingSeats === 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      {remainingSeats === 0 
                        ? 'Allocation perfectly balanced' 
                        : remainingSeats > 0 
                          ? `${remainingSeats} SEATS UNALLOCATED`
                          : `EXCEEDED BY ${Math.abs(remainingSeats)} SEATS`
                      }
                   </div>
                </div>

                {/* Error Banner */}
                {(isMgmtTooLow || isKcetTooLow || isComedkTooLow) && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200 flex items-start gap-4 mt-4">
                    <span className="material-symbols-outlined text-red-500 md:-mt-1">warning</span>
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                      Protocol Violation: Cannot reduce quota below current locked seats for this cycle.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 p-10 border-t border-slate-100 bg-white font-body">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all font-black">Cancel</button>
                <button 
                  onClick={handleSaveMatrix}
                  disabled={!canSave}
                  className={`flex-[1.5] px-4 py-5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    canSave 
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-2xl shadow-primary/30' 
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed grayscale'
                  }`}
                >
                  Commit Realignment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
