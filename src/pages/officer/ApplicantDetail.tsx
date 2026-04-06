import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'react-hot-toast'
import { applicantService } from '../../services/applicantService'
import { rulebookService } from '../../services/rulebookService'

const tabs = [
  { id: 1, label: 'Seat Allocation', icon: 'event_seat', color: 'text-primary' },
  { id: 2, label: 'Document Verification', icon: 'fact_check', color: 'text-blue-600' },
  { id: 3, label: 'Fee Collection', icon: 'payments', color: 'text-amber-600' },
  { id: 4, label: 'Final Confirmation', icon: 'verified', color: 'text-emerald-600' },
]

interface ApplicantDetailProps {
  isOpen: boolean
  onClose: () => void
  applicantId?: string
}

interface LocalApplicant {
  dbId: string;
  id: string;
  name: string;
  program: string;
  program_id: string;
  quota: string;
  isGovtQuota: boolean;
}

interface LocalDoc {
  id: string;
  name: string;
  isMandatory: boolean;
  status: string;
  level: string;
  quota: string;
}

export function ApplicantDetail({ isOpen, onClose, applicantId }: ApplicantDetailProps) {
  const [activeTab, setActiveTab] = useState(1)

  const [applicant, setApplicant] = useState<LocalApplicant | null>(null)
  const [seatMatrixData, setSeatMatrixData] = useState<any[]>([])
  const [applicableDocs, setApplicableDocs] = useState<LocalDoc[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ── Tab 1: Seat Allocation State ──
  const [seatLocked, setSeatLocked] = useState(false)
  const [seatCheckLoading, setSeatCheckLoading] = useState(false)
  const [seatError, setSeatError] = useState('')
  const [lockedSeatInfo, setLockedSeatInfo] = useState<{ program: string, quota: string, remaining?: number } | null>(null)
  const [allotmentNumber, setAllotmentNumber] = useState('')

  // ── Tab 2: Document Verification State ──
  const [docStatuses, setDocStatuses] = useState<Record<string, 'Pending' | 'Verified'>>({})

  // ── Tab 3: Fee Collection State ──
  const [feeRecordId, setFeeRecordId] = useState<string>('')
  const [feeAmount, setFeeAmount] = useState<number>(0)
  const [inputAmount, setInputAmount] = useState<string>('')
  const [feeRefNumber, setFeeRefNumber] = useState('')
  const [feePaid, setFeePaid] = useState(false)
  const [feeTimestamp, setFeeTimestamp] = useState('')

  // ── Tab 4: Final Confirmation ──
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!isOpen || !applicantId) return

    let isMounted = true
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [appRes, seatRes] = await Promise.all([
          applicantService.getApplicantById(applicantId),
          rulebookService.getSeatMatrices()
        ])
        
        if (!isMounted) return
        
        const appData = appRes.data
        if (!appData) return
        
        if (seatRes.data) setSeatMatrixData(seatRes.data)
        
        const mappedApplicant = {
          dbId: appData.id,
          id: appData.application_no || appData.id.slice(0, 8).toUpperCase(),
          name: appData.full_name,
          program: appData.programs?.name || 'N/A',
          program_id: appData.program_id,
          quota: appData.quota_type || 'N/A',
          isGovtQuota: appData.quota_type === 'KCET' || appData.quota_type === 'COMEDK'
        }
        setApplicant(mappedApplicant)

        const docsList: LocalDoc[] = (appData.applicant_documents || []).map((d: any) => ({
            id: d.id,
            name: d.document_masters?.name || 'Unknown Document',
            isMandatory: d.document_masters?.is_mandatory || false,
            status: d.status,
            level: d.document_masters?.applicable_level || 'All Levels',
            quota: d.document_masters?.applicable_quota || 'All Quotas',
        }))
        setApplicableDocs(docsList)

        // Seed Document Statuses
        const initDocStatuses: Record<string, 'Pending' | 'Verified'> = {}
        docsList.forEach((doc: LocalDoc) => {
          initDocStatuses[doc.id] = doc.status === 'VERIFIED' ? 'Verified' : 'Pending'
        })
        setDocStatuses(initDocStatuses)

        // Fees
        const feeRecord = appData.applicant_fees?.[0]
        if (feeRecord) {
            setFeeRecordId(feeRecord.id)
            setFeeAmount(feeRecord.amount || 0)
            setInputAmount(feeRecord.amount > 0 ? feeRecord.amount.toString() : '')
            const isPaid = feeRecord.status === 'PAID'
            setFeePaid(isPaid)
            setFeeRefNumber(isPaid ? feeRecord.transaction_ref || 'FEE-REF-' + mappedApplicant.id : '')
            setFeeTimestamp(isPaid && feeRecord.paid_at ? new Date(feeRecord.paid_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '')
        }

        // Seats & Confirmation
        const isSeatLocked = appData.status === 'SEAT_LOCKED' || appData.status === 'CONFIRMED'
        setSeatLocked(isSeatLocked)
        setLockedSeatInfo(isSeatLocked ? { program: mappedApplicant.program, quota: mappedApplicant.quota } : null)
        
        const isConf = appData.status === 'CONFIRMED'
        setConfirmed(isConf)
        setAdmissionNumber(appData.admission_number || '')

        setAllotmentNumber(appData.allotment_number || '')
        setSeatError('')
        setActiveTab(1)
        setIsConfirming(false)
        
      } catch (err) {
        toast.error('Failed to sync applicant details.')
        console.error(err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchData()
    
    return () => { isMounted = false }
  }, [isOpen, applicantId])

  if (!isOpen) return null
  if (isLoading || !applicant) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
       <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )

  // ── Derived Data ──
  const mandatoryDocs = applicableDocs.filter(d => d.isMandatory)
  const allMandatoryVerified = mandatoryDocs.length > 0 && mandatoryDocs.every(d => docStatuses[d.id] === 'Verified')
  const verifiedCount = applicableDocs.filter(d => docStatuses[d.id] === 'Verified').length

  const seatRowRaw = seatMatrixData.find(s => s.program_id === applicant.program_id)
  let seatRow = null
  if (seatRowRaw) {
    const quota = (applicant.quota || '').toLowerCase();
    const totalKey = `${quota}_quota` as keyof typeof seatRowRaw;
    const lockedKey = `${quota}_locked` as keyof typeof seatRowRaw;
    const total = Number(seatRowRaw[totalKey]) || 0;
    const locked = Number(seatRowRaw[lockedKey]) || 0;
    
    seatRow = {
      total,
      locked,
      available: total - locked
    };
  }

  const isGovtQuota = applicant.isGovtQuota

  // ── All 3 system checks ──
  const check1_seat = seatLocked
  const check2_docs = allMandatoryVerified || mandatoryDocs.length === 0
  const check3_fee = feePaid
  const allChecksPassed = check1_seat && check2_docs && check3_fee

  // ── Seat Check Handler ──
  const handleSeatCheck = async () => {
    setSeatCheckLoading(true)
    setSeatError('')

    try {
      if (!seatRow || seatRow.available <= 0) {
        setSeatError(`SEAT ALLOCATION FAILED — No available seats found for ${applicant.program} under ${applicant.quota} quota.`)
        return
      }
      
      const { error } = await applicantService.updateApplicant(applicant.dbId, {
          status: 'SEAT_LOCKED',
          allotment_number: allotmentNumber || undefined
      })
      if (error) throw error
      
      setSeatLocked(true)
      setLockedSeatInfo({ program: applicant.program, quota: applicant.quota, remaining: seatRow.available - 1 })
      toast.success('Seat securely locked!')
    } catch (err: any) {
        setSeatError(err.message || 'Failed to lock seat')
    } finally {
        setSeatCheckLoading(false)
    }
  }

  // ── Toggle Document Status ──
  const toggleDocStatus = async (docId: string) => {
    const current = docStatuses[docId] || 'Pending'
    const newStatus = current === 'Verified' ? 'PENDING' : 'VERIFIED'
    
    // Optimistic
    setDocStatuses(prev => ({ ...prev, [docId]: newStatus === 'VERIFIED' ? 'Verified' : 'Pending' }))
    try {
        await applicantService.updateDocumentStatus(docId, newStatus)
    } catch (_err) {
        toast.error('Failed to update document status')
        setDocStatuses(prev => ({ ...prev, [docId]: current }))
    }
  }

  // ── Fee Paid Handler (Self-Healing logic for legacy records) ──
  const handleFeePaid = async () => {
    if (!feeRefNumber.trim() || !inputAmount.trim()) return
    const amtNum = parseFloat(inputAmount)
    if (isNaN(amtNum) || amtNum <= 0) {
      toast.error("Please enter a valid fee amount.")
      return
    }

    const loader = toast.loading('Recording fee payment...')
    try {
        let currentRecordId = feeRecordId
        
        // If this is a legacy record (no fee object yet), create it on the fly
        if (!currentRecordId) {
            const { data: newFee, error: feeErr } = await applicantService.createFeeRecord(applicant.id, 0);
            if (feeErr || !newFee) throw new Error("Failed to initialize fee record");
            currentRecordId = (newFee as any).id;
            setFeeRecordId(currentRecordId);
        }

        await applicantService.recordFeePayment(currentRecordId, { 
          transaction_ref: feeRefNumber,
          amount: amtNum
        })
        setFeePaid(true)
        setFeeAmount(amtNum)
        setFeeTimestamp(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))
        toast.success('Fee marked as paid!', { id: loader })
    } catch (err) {
        console.error("Fee error:", err);
        toast.error('Failed to record fee. Please check connection.', { id: loader })
    }
  }

  // ── Final Confirmation Handler ──
  const handleConfirmAdmission = async () => {
    if (!allChecksPassed) return
    setIsConfirming(true)

    try {
      const result = await applicantService.confirmAdmission(applicant.dbId)
      if (result.success) {
          setAdmissionNumber(result.admission_number || '')
          setConfirmed(true)
          toast.success("Admission generated successfully!")
      } else {
          toast.error(result.message || 'Confirmation failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'Admission Confirmation process failed.')
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto text-left">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg"
        />

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl my-4 md:my-10 mx-4 bg-white rounded-3xl shadow-[0_60px_120px_rgba(0,0,0,0.25)] border border-surface-container overflow-hidden text-left max-h-[90vh] flex flex-col"
        >
          {/* ════════════════════════════════════════════════════════
              HEADER SECTION
              ════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-10 py-10 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(35,84,208,0.15),transparent_50%)]" />
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center text-4xl font-black text-white shrink-0 shadow-2xl">
                  {applicant.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-satoshi font-black tracking-tight leading-none">{applicant.name}</h2>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">{applicant.id}</span>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{applicant.program} • {applicant.quota} Quota</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-3">Admission Processing Workflow</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* ── Tab Navigation ── */}
            <div className="flex gap-2 mt-8 relative z-10">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                const isCompleted =
                  (tab.id === 1 && seatLocked) ||
                  (tab.id === 2 && allMandatoryVerified) ||
                  (tab.id === 3 && feePaid) ||
                  (tab.id === 4 && confirmed)

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xl shadow-black/20'
                        : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : ''}`}>
                      {isCompleted && !isActive ? 'check_circle' : tab.icon}
                    </span>
                    <span className="hidden md:inline">{tab.label}</span>
                    {isCompleted && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════
              TAB CONTENT AREA
              ════════════════════════════════════════════════════════ */}
          <div className="p-8 md:p-10 min-h-[400px] bg-slate-50/30 overflow-y-auto flex-1 custom-scrollbar">
            <AnimatePresence mode="wait">
              {/* ─────────────────────────────────────────────────────
                  TAB 1: SEAT ALLOCATION ENGINE
                  ───────────────────────────────────────────────────── */}
              {activeTab === 1 && (
                <motion.div
                  key="tab1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl text-primary">event_seat</span>
                    </div>
                    <div>
                      <h3 className="font-satoshi font-black text-xl text-slate-900 tracking-tight">Seat Allocation Engine</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mt-1">Query the Admin's Seat Matrix before proceeding</p>
                    </div>
                  </div>

                  {/* Applicant Seat Context */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Target Program</p>
                      <p className="text-2xl font-satoshi font-black text-slate-900 tracking-tight">{applicant.program}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Target Quota</p>
                      <p className="text-2xl font-satoshi font-black text-slate-900 tracking-tight">{applicant.quota}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Matrix Availability</p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-2xl font-satoshi font-black tracking-tight ${seatRow && seatRow.available > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {seatRow ? seatRow.available : '—'}
                        </p>
                        <span className="text-xs font-bold text-slate-400">/ {seatRow?.total || '—'} seats</span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Matrix Detail Panel */}
                  {seatRow && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">grid_view</span>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Seat Matrix Snapshot</h4>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${((seatRow.total - seatRow.available) / seatRow.total) * 100}%` }}
                              transition={{ duration: 1, delay: 0.3 }}
                              className={`h-full rounded-full ${seatRow.available > 0 ? 'bg-gradient-to-r from-primary to-blue-500' : 'bg-red-500'}`}
                            />
                          </div>
                          <span className="text-xs font-black text-slate-500 shrink-0">
                            {seatRow.total - seatRow.available} / {seatRow.total} Filled
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="py-3 px-4 bg-slate-50 rounded-xl">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Intake</p>
                            <p className="text-xl font-black font-mono text-slate-900 mt-1">{seatRow.total}</p>
                          </div>
                          <div className="py-3 px-4 bg-primary/5 rounded-xl">
                            <p className="text-[9px] font-black uppercase tracking-widest text-primary">Locked</p>
                            <p className="text-xl font-black font-mono text-primary mt-1">{seatRow.locked}</p>
                          </div>
                          <div className={`py-3 px-4 rounded-xl ${seatRow.available > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${seatRow.available > 0 ? 'text-emerald-600' : 'text-red-600'}`}>Available</p>
                            <p className={`text-xl font-black font-mono mt-1 ${seatRow.available > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{seatRow.available}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Banner */}
                  {seatError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4"
                    >
                      <span className="material-symbols-outlined text-red-500 text-2xl shrink-0 mt-0.5">error</span>
                      <div>
                        <h4 className="font-black text-sm text-red-800 uppercase tracking-wide">Seat Lock Rejected</h4>
                        <p className="text-sm text-red-700 mt-2 leading-relaxed font-medium">{seatError}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Lock Success */}
                  {seatLocked && lockedSeatInfo && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4"
                    >
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-emerald-600 text-2xl">lock</span>
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-emerald-800 uppercase tracking-wide">Seat Successfully Locked</h4>
                        <p className="text-sm text-emerald-700 mt-1 font-medium">
                          1 seat has been deducted from <span className="font-black">{lockedSeatInfo.program} — {lockedSeatInfo.quota}</span>.
                          {lockedSeatInfo.remaining !== undefined && <span className="opacity-70"> ({lockedSeatInfo.remaining} remaining)</span>}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Conditional: State Allotment Number for Govt Quota */}
                  {!seatLocked && isGovtQuota && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg text-amber-500">assured_workload</span>
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Official State Allotment Number</label>
                      </div>
                      <input
                        type="text"
                        value={allotmentNumber}
                        onChange={e => setAllotmentNumber(e.target.value)}
                        placeholder="e.g., KEA-99281"
                        className="w-full px-6 py-5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all font-mono font-black text-slate-900 uppercase placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                      />
                      <p className="text-[10px] text-slate-400 font-medium ml-1">
                        Required for <span className="font-black text-amber-600">{applicant.quota}</span> quota students. This number is issued by the State Exam Board and is mandatory for university registration.
                      </p>
                    </motion.div>
                  )}

                  {/* Action Button */}
                  {!seatLocked && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleSeatCheck}
                      disabled={seatCheckLoading || (isGovtQuota && !allotmentNumber.trim())}
                      className={`w-full py-5 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${
                        seatCheckLoading
                          ? 'bg-slate-200 text-slate-500 cursor-wait'
                          : (isGovtQuota && !allotmentNumber.trim())
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                            : 'bg-primary text-white hover:bg-blue-800 shadow-primary/25'
                      }`}
                    >
                      {seatCheckLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          Querying Seat Matrix...
                        </>
                      ) : (isGovtQuota && !allotmentNumber.trim()) ? (
                        <>
                          <span className="material-symbols-outlined text-xl">lock</span>
                          Enter Allotment Number to Proceed
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-xl">search_check</span>
                          Check & Lock Seat
                        </>
                      )}
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────
                  TAB 2: DOCUMENT VERIFICATION
                  ───────────────────────────────────────────────────── */}
              {activeTab === 2 && (
                <motion.div
                  key="tab2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl text-blue-600">fact_check</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-satoshi font-black text-xl text-slate-900 tracking-tight">Document Verification</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mt-1">Checklist auto-generated from Admin's Document Master</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black font-satoshi text-slate-900">{verifiedCount}<span className="text-slate-300">/{applicableDocs.length}</span></p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Verified</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      animate={{ width: `${(verifiedCount / applicableDocs.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full rounded-full transition-colors ${allMandatoryVerified ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    />
                  </div>

                  {/* Document Checklist */}
                  <div className="space-y-3">
                    {applicableDocs.map((doc, idx) => {
                      const status = docStatuses[doc.id] || 'Pending'
                      const isVerified = status === 'Verified'

                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`bg-white rounded-2xl border p-5 flex items-center gap-5 transition-all cursor-pointer group hover:shadow-md ${
                            isVerified ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 hover:border-blue-200'
                          }`}
                          onClick={() => toggleDocStatus(doc.id)}
                        >
                          {/* Toggle Checkbox */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            isVerified
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                              : 'bg-slate-100 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-400'
                          }`}>
                            <span className="material-symbols-outlined text-xl">
                              {isVerified ? 'check' : 'description'}
                            </span>
                          </div>

                          {/* Doc Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-black text-sm tracking-tight transition-colors ${isVerified ? 'text-emerald-800' : 'text-slate-900'}`}>
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              {doc.isMandatory ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                                  <span className="material-symbols-outlined text-[12px]">gpp_maybe</span> Mandatory
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Optional</span>
                              )}
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{doc.level}</span>
                            </div>
                          </div>

                          {/* Status Pill */}
                          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${
                            isVerified
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isVerified ? '✓ Verified' : '⏳ Pending'}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* All Mandatory Verified Banner */}
                  {allMandatoryVerified && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4"
                    >
                      <span className="material-symbols-outlined text-emerald-500 text-2xl">verified</span>
                      <p className="font-black text-sm text-emerald-800 uppercase tracking-wide">
                        All mandatory documents have been verified
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────
                  TAB 3: FEE COLLECTION
                  ───────────────────────────────────────────────────── */}
              {activeTab === 3 && (
                <motion.div
                  key="tab3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                   <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl text-amber-600">payments</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-satoshi font-black text-xl text-slate-900 tracking-tight">Fee Collection</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mt-1">Record fee payment for admission clearance</p>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black font-satoshi text-amber-600">₹{feeAmount.toLocaleString()}/-</p>
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Processing Fee (NTF)</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-8">
                    {/* Fee Reference Input */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Fee Amount (NTF)</label>
                        <div className="relative">
                           <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                           <input
                              type="number"
                              value={inputAmount}
                              onChange={e => setInputAmount(e.target.value)}
                              disabled={feePaid}
                              placeholder="e.g., 450000"
                              className={`w-full pl-10 pr-6 py-5 rounded-xl border text-sm font-black transition-all outline-none ${
                                feePaid
                                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 cursor-not-allowed'
                                  : 'bg-slate-50/50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary/30'
                              }`}
                           />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Reference / Transaction #</label>
                        <input
                          type="text"
                          value={feeRefNumber}
                          onChange={e => setFeeRefNumber(e.target.value)}
                          disabled={feePaid}
                          placeholder="e.g., TXN-2026-04-05"
                          className={`w-full px-6 py-5 rounded-xl border text-sm font-black transition-all outline-none ${
                            feePaid
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 cursor-not-allowed'
                              : 'bg-slate-50/50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary/30 placeholder:text-slate-300'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Fee Status Area */}
                    {feePaid ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">check</span>
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-emerald-800 uppercase tracking-wide">Fee Payment Recorded</h4>
                            <p className="text-xs text-emerald-600 font-medium mt-0.5">Ref: {feeRefNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          Timestamped: {feeTimestamp}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                          <span className="material-symbols-outlined text-amber-500 text-lg shrink-0 mt-0.5">info</span>
                          <p className="text-xs font-medium text-amber-800 leading-relaxed">
                            Enter the fee reference/transaction number first, then click the button below to mark the fee as paid. This action timestamps the payment record and cannot be easily undone.
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleFeePaid}
                          disabled={!feeRefNumber.trim() || !inputAmount.trim()}
                          className={`w-full py-5 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                            feeRefNumber.trim() && inputAmount.trim()
                              ? 'bg-amber-500 text-white shadow-xl shadow-amber-200 hover:bg-amber-600'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">receipt_long</span>
                          Mark Fee as Paid
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────
                  TAB 4: FINAL CONFIRMATION
                  ───────────────────────────────────────────────────── */}
              {activeTab === 4 && (
                <motion.div
                  key="tab4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl text-emerald-600">verified</span>
                    </div>
                    <div>
                      <h3 className="font-satoshi font-black text-xl text-slate-900 tracking-tight">Final Confirmation</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mt-1">System pre-flight checks before admission lock</p>
                    </div>
                  </div>

                  {/* 3 System Checks */}
                  <div className="space-y-4">
                    {/* Check 1: Seat Locked */}
                    <div className={`bg-white rounded-2xl border p-6 flex items-center gap-5 transition-all ${check1_seat ? 'border-emerald-200' : 'border-slate-200'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${check1_seat ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                        <span className="material-symbols-outlined text-2xl">{check1_seat ? 'check' : 'close'}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-slate-900 uppercase tracking-wide">Seat Locked?</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {check1_seat ? `Seat secured for ${applicant.program} under ${applicant.quota} quota` : 'No seat has been locked from the Seat Matrix yet'}
                        </p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${check1_seat ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {check1_seat ? 'Passed' : 'Failed'}
                      </div>
                    </div>

                    {/* Check 2: Mandatory Docs */}
                    <div className={`bg-white rounded-2xl border p-6 flex items-center gap-5 transition-all ${check2_docs ? 'border-emerald-200' : 'border-slate-200'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${check2_docs ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                        <span className="material-symbols-outlined text-2xl">{check2_docs ? 'check' : 'close'}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-slate-900 uppercase tracking-wide">Mandatory Docs Verified?</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {check2_docs
                            ? `All ${mandatoryDocs.length} mandatory documents have been verified`
                            : `${mandatoryDocs.filter(d => docStatuses[d.id] === 'Verified').length} of ${mandatoryDocs.length} mandatory documents verified`}
                        </p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${check2_docs ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {check2_docs ? 'Passed' : 'Failed'}
                      </div>
                    </div>

                    {/* Check 3: Fee Paid */}
                    <div className={`bg-white rounded-2xl border p-6 flex items-center gap-5 transition-all ${check3_fee ? 'border-emerald-200' : 'border-slate-200'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${check3_fee ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                        <span className="material-symbols-outlined text-2xl">{check3_fee ? 'check' : 'close'}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-slate-900 uppercase tracking-wide">Fee Paid?</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {check3_fee ? `Payment confirmed — Ref: ${feeRefNumber}` : 'Fee payment has not been recorded yet'}
                        </p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${check3_fee ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {check3_fee ? 'Passed' : 'Failed'}
                      </div>
                    </div>
                  </div>

                  {/* Overall Status */}
                  {!confirmed && (
                    <div className={`rounded-2xl p-5 border flex items-center gap-4 ${
                      allChecksPassed
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`material-symbols-outlined text-2xl ${allChecksPassed ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {allChecksPassed ? 'task_alt' : 'pending'}
                      </span>
                      <p className={`text-xs font-black uppercase tracking-widest ${allChecksPassed ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {allChecksPassed
                          ? 'ALL PRE-FLIGHT CHECKS PASSED — READY FOR CONFIRMATION'
                          : `${[check1_seat, check2_docs, check3_fee].filter(Boolean).length}/3 CHECKS CLEARED — COMPLETE ALL TO PROCEED`}
                      </p>
                    </div>
                  )}

                  {/* Confirmed Success State */}
                  {confirmed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-3xl p-8 text-center space-y-5"
                    >
                      <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
                        <span className="material-symbols-outlined text-white text-4xl">celebration</span>
                      </div>
                      <h3 className="text-2xl font-satoshi font-black text-emerald-900 tracking-tight">Admission Confirmed!</h3>
                      <div className="bg-white rounded-2xl border border-emerald-200 p-6 max-w-sm mx-auto">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Official Admission Number</p>
                        <p className="text-xl font-mono font-black text-emerald-700 tracking-wider">{admissionNumber}</p>
                      </div>
                      <p className="text-xs text-emerald-600 font-medium">
                        This number is immutable and has been permanently assigned to <span className="font-black">{applicant.name}</span>
                      </p>
                    </motion.div>
                  )}

                  {/* Confirm Admission Button */}
                  {!confirmed && (
                    <motion.button
                      whileHover={allChecksPassed ? { scale: 1.01 } : {}}
                      whileTap={allChecksPassed ? { scale: 0.99 } : {}}
                      onClick={handleConfirmAdmission}
                      disabled={!allChecksPassed || isConfirming}
                      className={`w-full py-6 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all ${
                        isConfirming
                          ? 'bg-slate-200 text-slate-500 cursor-wait'
                          : allChecksPassed
                            ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-2xl shadow-emerald-300/50 hover:from-emerald-700 hover:to-green-700'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                    >
                      {isConfirming ? (
                        <>
                          <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          Generating Admission Number...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-2xl">how_to_reg</span>
                          Confirm Admission
                        </>
                      )}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ════════════════════════════════════════════════════════
              FOOTER
              ════════════════════════════════════════════════════════ */}
          <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              Close Panel
            </button>
            <div className="flex items-center gap-3">
              {activeTab > 1 && (
                <button
                  onClick={() => setActiveTab(activeTab - 1)}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Previous
                </button>
              )}
              {activeTab < 4 && (
                <button
                  onClick={() => setActiveTab(activeTab + 1)}
                  className="px-6 py-3 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-800 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  Next Step
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
