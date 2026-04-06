import { motion } from 'motion/react'

export const DesktopRestriction = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-surface-container-lowest flex items-center justify-center p-8 text-center lg:hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-10 shadow-[0_40px_80px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center mb-8 border border-primary/10 shadow-inner">
          <span className="material-symbols-outlined text-[40px] text-primary">desktop_windows</span>
        </div>
        
        <h2 className="text-2xl font-satoshi font-black text-slate-900 mb-3 tracking-tight">Desktop Required</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-6">CRM Workspace Limitation</p>
        
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
          The EduMerge application is a full-featured CRM designed for complex workflows and data visualization. 
          To ensure an optimal experience and prevent data entry errors, please access this platform on a desktop or laptop device with a screen resolution of at least 1024px.
        </p>

        <div className="w-full h-px bg-slate-100 mb-8" />

        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
           <span className="material-symbols-outlined text-[14px]">warning</span>
           Currently restricted on mobile/tablet
        </div>
      </motion.div>
    </div>
  )
}
