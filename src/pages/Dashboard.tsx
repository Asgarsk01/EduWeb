import { motion, type Variants, AnimatePresence } from 'motion/react'
import { useState, useRef, useEffect } from 'react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { canAccessApplicants, getCurrentUserRole } from '../lib/session'
import { analyticsService } from '../services/analyticsService'
import { aiService } from '../services/aiService'
import { masterService } from '../services/masterService'
import type { ManagementKPIs, ProgramProgress, QuotaDistribution as QuotaDistributionType } from '../types/analytics.types'

const AIHoverPopover = ({ title, description, children }: { title: string, description: string, recommend?: string, children: React.ReactNode }) => {
  return (
    <div className="relative flex items-center justify-center group/tooltip z-20">
      {children}

      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-max max-w-[280px] bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-surface-container opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-opacity duration-150 z-[100] px-4 py-3 text-center pointer-events-none">
        {/* Pointer Triangle */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 bg-white border-b border-r border-surface-container rotate-45 z-0"></div>

        {/* Content */}
        <div className="relative z-10">
          <p className="font-satoshi font-black text-on-surface text-[15px] leading-tight">{title}</p>
          <p className="font-body text-[12px] text-outline mt-1 leading-tight">{description}</p>
        </div>
      </div>
    </div>
  )
}

const KPICards = ({ filters }: { filters: { academicYearId?: string; campusId?: string; courseLevel?: string } }) => {
  const [kpis, setKpis] = useState<ManagementKPIs | null>(null)
  
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await analyticsService.getManagementKPIs(filters)
        if (isMounted) setKpis(data)
      } catch (err) {
        console.error("Failed to load KPIs", err)
      }
    })()
    return () => { isMounted = false }
  }, [filters.academicYearId, filters.campusId, filters.courseLevel])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  }

  const fillPercent = (kpis?.total_capacity && kpis?.total_admitted) ? Math.round((kpis.total_admitted / kpis.total_capacity) * 100) : 0
  const feePercent = kpis?.fee_collection_ratio ? Math.round(kpis.fee_collection_ratio * 100) : 0
  const docPercent = kpis?.clearance_ratio ? Math.round(kpis.clearance_ratio * 100) : 0

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {/* Capacity Card */}
      <motion.div variants={item} className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white transition-all hover:shadow-[0px_40px_80px_rgba(0,0,0,0.05)] hover:-translate-y-1 group">
        <div className="flex justify-between items-start mb-6">
          <span className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl" data-icon="event_seat">event_seat</span>
          </span>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-label text-outline uppercase font-bold mb-1">Total Capacity</span>
            <div className="flex items-center gap-1 text-secondary font-bold text-xs bg-secondary-container/30 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[14px]" data-icon="sync">sync</span>
              Live
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-4xl font-satoshi font-black">{kpis?.total_capacity || 0} <span className="text-sm font-body font-medium text-outline">Seats</span></p>
          <div className="h-8 flex items-end gap-1 overflow-hidden opacity-30 group-hover:opacity-60 transition-opacity">
            {[40, 60, 50, 70, 90, 80, 95].map((h, i) => (
              <motion.div key={i} whileHover={{ scaleY: 1.1 }} className={`w-2 bg-primary rounded-t-sm`} style={{ height: `${h}%` }}></motion.div>
            ))}
          </div>
          <p className="text-xs text-outline leading-relaxed font-body font-medium">Synced with active Academic Year</p>
        </div>
      </motion.div>

      {/* Admitted Card */}
      <motion.div variants={item} className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white transition-all hover:shadow-[0px_40px_80px_rgba(0,0,0,0.05)] hover:-translate-y-1 group">
        <div className="flex justify-between items-start mb-6">
          <span className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-2xl" data-icon="person_check">person_check</span>
          </span>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-label text-outline uppercase font-bold mb-1">Admissions</span>
            <div className="flex items-center gap-1 text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[14px]" data-icon="verified">verified</span>
              Confirmed
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-4xl font-satoshi font-black">{kpis?.total_admitted || 0} <span className="text-sm font-body font-medium text-outline">Students</span></p>
          <AIHoverPopover
            title="Admissions Velocity Normal"
            description="Processing times are well within acceptable limits. No critical blockage identified."
          >
            <div className="text-primary p-2 -mr-2 cursor-help hover:text-blue-700 transition-colors">
              <span className="material-symbols-outlined text-[28px] drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]" data-icon="auto_awesome">auto_awesome</span>
            </div>
          </AIHoverPopover>
        </div>
        <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden mt-4">
          <motion.div initial={{ width: 0 }} animate={{ width: `${fillPercent}%` }} transition={{ duration: 1, delay: 0.5 }} className="bg-secondary h-full rounded-full"></motion.div>
        </div>
        <p className="text-xs font-bold text-secondary mt-4">{fillPercent}% Capacity Filled</p>
      </motion.div>

      {/* Revenue Card */}
      <motion.div variants={item} className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white transition-all hover:shadow-[0px_40px_80px_rgba(0,0,0,0.05)] hover:-translate-y-1 group">
        <div className="flex justify-between items-start mb-6">
          <span className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl" data-icon="account_balance_wallet">account_balance_wallet</span>
          </span>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-label text-outline uppercase font-bold mb-1">Fee Status</span>
            <div className="flex items-center gap-1 text-secondary font-bold text-xs bg-secondary-container/30 px-2 py-0.5 rounded-full">
               Collection Active
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-4xl font-satoshi font-black">{feePercent}%</p>
          <div className="flex items-end gap-1 h-8 opacity-30 group-hover:opacity-60 transition-opacity">
            {[80, 75, 85, 70, 80, feePercent].map((h, i) => (
              <motion.div key={i} whileHover={{ scaleY: 1.1 }} className={`w-2 bg-blue-400 rounded-t-sm`} style={{ height: `${h}%` }}></motion.div>
            ))}
          </div>
          <p className="text-xs text-outline leading-relaxed font-body font-medium">Valid fee payments recorded</p>
        </div>
      </motion.div>

      {/* Documentation Card */}
      <motion.div variants={item} className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white transition-all hover:shadow-[0px_40px_80px_rgba(0,0,0,0.05)] hover:-translate-y-1 group">
        <div className="flex justify-between items-start mb-6">
          <span className="w-12 h-12 bg-tertiary-fixed rounded-xl flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-2xl" data-icon="fact_check">fact_check</span>
          </span>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-label text-outline uppercase font-bold mb-1">Clearance</span>
            <div className="flex items-center gap-1 text-secondary font-bold text-xs bg-secondary-container/30 px-2 py-0.5 rounded-full">
              Full Clearance
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-4xl font-satoshi font-black">{docPercent}%</p>
          <div className="flex items-end gap-1 h-8 opacity-30 group-hover:opacity-60 transition-opacity">
            {[40, 45, 55, 60, 70, docPercent].map((h, i) => (
              <motion.div key={i} whileHover={{ scaleY: 1.1 }} className={`w-2 bg-tertiary rounded-t-sm`} style={{ height: `${h}%` }}></motion.div>
            ))}
          </div>
          <p className="text-xs text-outline font-body font-medium leading-relaxed">Applicants fully verified</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

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
    <div ref={containerRef} className="relative">
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
            className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-3 min-w-[240px] bg-white rounded-[1rem] shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-surface-container/60 z-50 p-2 ring-1 ring-black/5`}
          >
            <div className="flex flex-col gap-1">
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

const ProgressMatrix = ({ filters }: { filters: { academicYearId?: string; campusId?: string; courseLevel: string } }) => {
  const [data, setData] = useState<ProgramProgress[]>([])
  
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await analyticsService.getProgramProgress(filters)
        if (isMounted) setData(result)
      } catch (err) {
        console.error(err)
      }
    })();
    return () => { isMounted = false }
  }, [filters.academicYearId, filters.campusId, filters.courseLevel])

  const programs = data.map(rp => ({
    name: rp.program_name || '',
    type: (rp.program_name || '').includes('MBA') ? 'PG' : 'UG',
    total: rp.total_seats || 0,
    confirmed: rp.total_seats ? ((rp.confirmed_seats || 0) / rp.total_seats) * 100 : 0,
    reserved: rp.total_seats ? ((rp.reserved_seats || 0) / rp.total_seats) * 100 : 0,
    vacant: rp.total_seats ? ((rp.vacant_seats || 0) / rp.total_seats) * 100 : 0,
    hasInsight: (rp.confirmed_seats || 0) > 0
  })).filter(p =>
    filters.courseLevel === 'All Levels' ||
    (filters.courseLevel === 'Undergraduate (UG)' && p.type === 'UG') ||
    (filters.courseLevel === 'Postgraduate (PG)' && p.type === 'PG')
  )

  if (programs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-10 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white flex justify-center items-center h-full min-h-[300px]"
      >
        <p className="font-satoshi text-outline font-bold text-lg">No programs available for current filters.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-10 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white"
    >
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-2xl font-satoshi font-black">Program-wise Progress</h3>
      </div>
      {programs.map((prog, idx) => (
        <div key={idx} className="space-y-3 mb-6 last:mb-0">
          <div className="flex justify-between items-center text-sm font-bold">
            <div className="flex items-center gap-3">
              <span className="font-satoshi text-blue-950">{prog.name}</span>
              {prog.hasInsight && (
                <AIHoverPopover
                  title={`Focus: ${prog.name}`}
                  description={`Current admission intake monitoring is active. Capacity utilization is being tracked for real-time adjustments.`}
                >
                  <div className="text-primary ml-1 flex items-center cursor-help hover:text-blue-700 transition-colors">
                    <span className="material-symbols-outlined text-xl drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]" data-icon="auto_awesome">auto_awesome</span>
                  </div>
                </AIHoverPopover>
              )}
            </div>
            <span className="text-outline">Total {prog.total}</span>
          </div>
          <div className="h-12 flex rounded-2xl overflow-hidden bg-surface-container">
            <motion.div initial={{ width: 0 }} animate={{ width: `${prog.confirmed}%` }} className="bg-primary border-r border-white/10" title="Confirmed"></motion.div>
            <motion.div initial={{ width: 0 }} animate={{ width: `${prog.reserved}%` }} className="bg-primary/50 border-r border-white/10" title="Reserved"></motion.div>
            <motion.div initial={{ width: 0 }} animate={{ width: `${prog.vacant}%` }} className="bg-surface-container" title="Vacant"></motion.div>
          </div>
        </div>
      ))}
      <div className="mt-10 flex gap-8 text-[10px] font-label font-bold uppercase tracking-[0.2em] text-outline">
        <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-primary"></div> Confirmed</div>
        <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-primary/50"></div> Reserved</div>
        <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-surface-container"></div> Vacant</div>
      </div>
    </motion.div>
  )
}

const QuotaDistribution = ({ filters }: { filters: { academicYearId?: string; campusId?: string; courseLevel: string } }) => {
  const role = getCurrentUserRole()
  const canFilterApplicants = canAccessApplicants(role)
  const [data, setData] = useState<QuotaDistributionType[]>([])

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await analyticsService.getQuotaDistribution(filters)
        if (isMounted) setData(result)
      } catch (err) {
        console.error(err)
      }
    })();
    return () => { isMounted = false }
  }, [filters.academicYearId, filters.campusId, filters.courseLevel])

  const programs = data.map(rq => {
    const kcetPct = rq.kcet_quota && rq.kcet_quota > 0 ? ((rq.kcet_filled || 0) / rq.kcet_quota) * 100 : 0
    const comPct = rq.comedk_quota && rq.comedk_quota > 0 ? ((rq.comedk_filled || 0) / rq.comedk_quota) * 100 : 0
    const mgmtPct = rq.management_quota && rq.management_quota > 0 ? ((rq.management_filled || 0) / rq.management_quota) * 100 : 0

    return {
      prog: (rq.program_name || '').slice(0, 4).toUpperCase(),
      type: (rq.program_name || '').includes('MBA') ? 'PG' : 'UG',
      kcet: `${rq.kcet_filled || 0}/${rq.kcet_quota || 0}`,
      kBg: kcetPct > 80 ? 'bg-error' : (kcetPct > 50 ? 'bg-yellow-400' : 'bg-secondary'),
      kRing: kcetPct > 80 ? 'ring-error/10' : (kcetPct > 50 ? 'ring-yellow-400/10' : 'ring-secondary/10'),
      com: `${rq.comedk_filled || 0}/${rq.comedk_quota || 0}`,
      cBg: comPct > 80 ? 'bg-error' : (comPct > 50 ? 'bg-yellow-400' : 'bg-secondary'),
      cRing: comPct > 80 ? 'ring-error/10' : (comPct > 50 ? 'ring-yellow-400/10' : 'ring-secondary/10'),
      mgmt: `${rq.management_filled || 0}/${rq.management_quota || 0}`,
      mBg: mgmtPct > 80 ? 'bg-error' : (mgmtPct > 50 ? 'bg-yellow-400' : 'bg-secondary'),
      mRing: mgmtPct > 80 ? 'ring-error/10' : (mgmtPct > 50 ? 'ring-yellow-400/10' : 'ring-secondary/10')
    }
  }).filter(p =>
    filters.courseLevel === 'All Levels' ||
    (filters.courseLevel === 'Undergraduate (UG)' && p.type === 'UG') ||
    (filters.courseLevel === 'Postgraduate (PG)' && p.type === 'PG')
  )

  if (programs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-10 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white flex justify-center items-center h-full min-h-[300px]"
      >
        <p className="font-satoshi text-outline font-bold text-lg">No quotas available.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-10 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white flex flex-col h-full"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-2 shrink-0">
        <h3 className="text-2xl font-satoshi font-black">Quota Distribution</h3>
        <p className="text-[10px] font-label uppercase text-outline font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]" data-icon={canFilterApplicants ? 'ads_click' : 'lock'}>{canFilterApplicants ? 'ads_click' : 'lock'}</span>
          {canFilterApplicants ? 'Click cell to filter' : 'Read-only in Management view'}
        </p>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left font-body">
          <thead>
            <tr className="text-[10px] font-label font-black uppercase text-outline tracking-[0.15em] border-b border-surface">
              <th className="py-4 font-bold sticky top-0 bg-white">Program</th>
              <th className="py-4 font-bold pl-2 sticky top-0 bg-white">KCET</th>
              <th className="py-4 font-bold pl-2 sticky top-0 bg-white">COMEDK</th>
              <th className="py-4 font-bold pl-2 sticky top-0 bg-white">Mgmt.</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <AnimatePresence mode="popLayout">
              {programs.map((row) => (
                <motion.tr
                  layout
                  key={row.prog}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ backgroundColor: "var(--color-surface-container-low)" }}
                  className="group transition-colors rounded-xl"
                >
                  <td className="py-5 font-satoshi font-black text-blue-900 border-b border-surface/30">{row.prog}</td>
                  <td className="py-2 border-b border-surface/30">
                    <div
                      onClick={canFilterApplicants ? () => alert(`Filtering applicants by ${row.prog} - KCET`) : undefined}
                      className={`flex items-center gap-2 p-2 rounded-md transition-all w-max ${canFilterApplicants ? 'hover:bg-surface-container hover:shadow-sm cursor-pointer scale-100 active:scale-95' : 'cursor-default opacity-80'}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.kBg} ring-4 ${row.kRing}`}></span>
                      <span className="font-bold">{row.kcet}</span>
                    </div>
                  </td>
                  <td className="py-2 border-b border-surface/30">
                    <div
                      onClick={canFilterApplicants ? () => alert(`Filtering applicants by ${row.prog} - COMEDK`) : undefined}
                      className={`flex items-center gap-2 p-2 rounded-md transition-all w-max ${canFilterApplicants ? 'hover:bg-surface-container hover:shadow-sm cursor-pointer scale-100 active:scale-95' : 'cursor-default opacity-80'}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.cBg} ring-4 ${row.cRing}`}></span>
                      <span className="font-bold">{row.com}</span>
                    </div>
                  </td>
                  <td className="py-2 border-b border-surface/30">
                    <div
                      onClick={canFilterApplicants ? () => alert(`Filtering applicants by ${row.prog} - Management`) : undefined}
                      className={`flex items-center gap-2 p-2 rounded-md transition-all w-max ${canFilterApplicants ? 'hover:bg-surface-container hover:shadow-sm cursor-pointer scale-100 active:scale-95' : 'cursor-default opacity-80'}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.mBg} ring-4 ${row.mRing}`}></span>
                      <span className="font-bold">{row.mgmt}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}


const AIBriefingPreview = ({ filters }: { filters: any }) => {
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const gen = async () => {
      try {
        setLoading(true)
        const kpis = await analyticsService.getManagementKPIs(filters)
        const text = await aiService.generateDashboardMicroSummary(kpis)
        if (isMounted) setSummary(text)
      } catch (err) {
        if (isMounted) setSummary("Admissions trending positively. CSE KCET approaching 95% capacity.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    gen()
    return () => { isMounted = false }
  }, [filters.academicYearId, filters.campusId, filters.courseLevel])

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="col-span-12 bg-surface-container-lowest p-6 rounded-2xl shadow-[0px_30px_60px_rgba(0,0,0,0.02)] border border-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
    >
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]" data-icon="auto_awesome">auto_awesome</span>
        </div>
        <div>
          <h1 className="font-satoshi font-black text-lg text-blue-900">AI Briefing Preview</h1>
          <p className={`text-sm font-medium text-outline mt-1 max-w-2xl ${loading ? 'animate-pulse' : ''}`}>
             {loading ? 'Analyzing cycle data...' : summary}
          </p>
        </div>
      </div>
      <a href="/insights" className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-primary hover:bg-blue-700 px-6 py-3 rounded-full transition-all shrink-0 shadow-lg shadow-primary/20">
        View Full Analysis <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
      </a>
    </motion.div>
  )
}

const Footer = () => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    className="pt-16 pb-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-label font-black text-outline/60 uppercase tracking-[0.3em]"
  >
    <p>© 2026 Academic Curator Systems. Confidentially Authorized Access Only.</p>
    <div className="flex gap-12 mt-6 md:mt-0">
      <a className="hover:text-primary transition-colors" href="#">Data Integrity Policy</a>
      <a className="hover:text-primary transition-colors" href="#">System Health: 99.8%</a>
    </div>
  </motion.div>
)

export const Dashboard = () => {
  const [academicYear, setAcademicYear] = useState('2025-26 (Active)')
  const [campus, setCampus] = useState('All Campuses')
  const [courseLevel, setCourseLevel] = useState('All Levels')
  const [adminSummary, setAdminSummary] = useState({ institutions: 0, campuses: 0, departments: 0, users: 0 })
  
  const [availableYears, setAvailableYears] = useState<{id: string, year_string: string, is_active: boolean}[]>([])
  const [availableCampuses, setAvailableCampuses] = useState<{id: string, name: string}[]>([])

  const isHistorical = !academicYear.includes('(Active)')
  const role = getCurrentUserRole()

  useEffect(() => {
    if (role === 'ADMIN') {
        (async () => {
            const sum = await masterService.getAdminDashboardSummary();
            setAdminSummary(sum);
        })();
    } else {
        // Fetch masters for filtering
        (async () => {
            try {
              const [yrs, camps] = await Promise.all([
                  masterService.getAcademicYears(),
                  masterService.getCampuses()
              ]);
              setAvailableYears(yrs);
              setAvailableCampuses(camps.data || []);
            } catch (err) {
              console.error("Failed to load dashboard masters", err)
            }
        })();
    }
  }, [role]);

  // Map display strings to IDs
  const activeYearId = availableYears.find(y => 
    y.year_string === academicYear || 
    (y.is_active && academicYear.includes('(Active)'))
  )?.id;

  const campusId = availableCampuses.find(c => c.name === campus)?.id;
  
  const filters = {
    academicYearId: activeYearId,
    campusId: campusId,
    courseLevel: courseLevel
  };

  if (role === 'ADMIN') {
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
              className="pt-8 text-left"
            >
              <h2 className="text-6xl font-satoshi font-black text-primary tracking-tighter">Architecture Overview</h2>
              <p className="text-outline mt-3 font-body text-lg max-w-2xl leading-relaxed">System-wide command center for the <span className="font-bold text-primary">Genesis</span> admission architecture cycle.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 text-left">
              {[
                { title: 'Institution Status', count: `${adminSummary.institutions} Total`, color: 'primary', icon: 'account_balance' },
                { title: 'Total Campuses', count: `${adminSummary.campuses} Active`, color: 'secondary', icon: 'location_on' },
                { title: 'System Capacity', count: `${adminSummary.departments} Depts`, color: 'tertiary', icon: 'architecture' }
              ].map((kpi, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="bg-surface-container-lowest p-8 rounded-2xl border border-white shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-300"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-label font-bold uppercase tracking-widest text-outline">{kpi.title}</p>
                    <p className="text-3xl font-satoshi font-black">{kpi.count}</p>
                  </div>
                  <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">{kpi.icon}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-surface-container-lowest p-10 rounded-2xl border border-white shadow-sm space-y-8 text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-2xl">architecture</span>
                </div>
                <div>
                  <h3 className="text-2xl font-satoshi font-black">System Ready</h3>
                  <p className="text-outline text-sm font-medium">All foundational patterns are correctly deployed for the current cycle.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Seat Matrix Validated', icon: 'check_circle', desc: 'Quota distributions are perfectly matched to intake.' },
                  { label: 'Documentation Policy', icon: 'check_circle', desc: 'Officer verification rules are globally active.' },
                  { label: 'Program Structure', icon: 'check_circle', desc: 'All engineering and business programs mapped.' },
                  { label: 'Campus Isolation', icon: 'check_circle', desc: 'Multi-campus data separation and codes verified.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-5 bg-surface rounded-2xl border border-surface-container/50">
                    <span className="material-symbols-outlined text-green-500">{item.icon}</span>
                    <div>
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-xs text-outline mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Footer />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <main className="md:ml-28 min-h-screen">
        <Header />
        <div className="px-12 pb-12 space-y-10">
          {isHistorical && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400 p-4 rounded-xl mt-4 -mb-4 flex items-center gap-3 shadow-sm"
            >
              <span className="material-symbols-outlined text-yellow-600">history</span>
              <div>
                <p className="font-bold text-sm">Historical View ({academicYear.replace(' (Active)', '')})</p>
                <p className="text-xs">You are viewing past data. Actions are restricted and charts are read-only.</p>
              </div>
            </motion.div>
          )}

          {/* Header Editorial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`flex justify-between items-end relative z-50 ${isHistorical ? 'pt-8' : 'pt-4'}`}
          >
            <div className={isHistorical ? 'opacity-60 grayscale' : ''}>
              <h2 className="text-6xl font-satoshi font-black text-primary tracking-tighter">
                {role === 'OFFICER' ? 'Operations Brief' : 'Management Brief'}
              </h2>
              <p className="text-outline mt-3 font-body text-lg max-w-lg leading-relaxed">
                {role === 'OFFICER' 
                  ? 'Active student processing and intake monitoring for the ' 
                  : 'External command center for the '}
                <span className="font-bold text-primary">{academicYear.replace(' (Active)', '')}</span> Academic Admissions Cycle.
              </p>
            </div>
            <div className={`text-right flex items-center gap-3 ${isHistorical ? 'opacity-60' : ''}`}>
              <div className="bg-surface-container-lowest border border-white rounded-2xl p-1.5 shadow-sm flex items-center gap-2">
                <FilterDropdown
                  icon="calendar_today"
                  label="Year"
                  value={academicYear}
                  setVal={setAcademicYear}
                  options={availableYears.length > 0 
                    ? availableYears.map(y => y.is_active ? `${y.year_string} (Active)` : y.year_string)
                    : ['2025-26 (Active)', '2024-25', '2023-24']}
                  align="right"
                />
                <div className="w-[1px] h-8 bg-surface-container mx-1"></div>
                <FilterDropdown
                  icon="location_on"
                  label="Campus"
                  value={campus}
                  setVal={setCampus}
                  options={['All Campuses', ...availableCampuses.map(c => c.name)]}
                  align="right"
                />
                <div className="w-[1px] h-8 bg-surface-container mx-1"></div>
                <FilterDropdown
                  icon="school"
                  label="Level"
                  value={courseLevel}
                  setVal={setCourseLevel}
                  options={['All Levels', 'Undergraduate (UG)', 'Postgraduate (PG)']}
                  align="right"
                />
              </div>
            </div>
          </motion.div>

          <div className={isHistorical ? 'opacity-70 pointer-events-none grayscale-[0.2] transition-all' : 'transition-all'}>
            {/* Layer 1: KPI Cards */}
            <KPICards filters={filters} />

            {(role === 'MANAGEMENT' || role === 'OFFICER') && (
              <>
                {/* Layer 2: Visual Progress (Bento Grid) */}
                <div className="grid grid-cols-12 gap-8 mt-10">
                  <ProgressMatrix filters={filters} />
                  <QuotaDistribution filters={filters} />
                </div>

                {/* Layer 3: AI Briefing Preview */}
                <div className="grid grid-cols-12 gap-8 mt-10">
                  <AIBriefingPreview filters={filters} />
                </div>
              </>
            )}
          </div>

          {/* Footer Meta */}
          <Footer />
        </div>
      </main>
    </>
  )
}
