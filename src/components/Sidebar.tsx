import { Link, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { getCurrentUserRole, clearCurrentUserRole } from '../lib/session'
import { authService } from '../services/authService'

export const Sidebar = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [isBottomHovered, setIsBottomHovered] = useState<string | null>(null)
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const location = useLocation()
  const role = getCurrentUserRole()

  const getNavItems = (role: string) => {
    if (role === 'ADMIN') {
      return [
        { icon: 'account_balance', label: 'Institution & Campus', to: '/admin/institution' },
        { icon: 'school', label: 'Department & Program', to: '/admin/department' },
        { icon: 'calendar_today', label: 'Academic Year', to: '/admin/academic-year' },
        { icon: 'grid_view', label: 'Seat Matrix', to: '/admin/seat-matrix' },
        { icon: 'fact_check', label: 'Document Master', to: '/admin/document-master' },
        { icon: 'group', label: 'User Management', to: '/admin' },
      ];
    }
    if (role === 'OFFICER') {
      return [
        { icon: 'dashboard', label: 'Dashboard', to: '/' },
        { icon: 'person', label: 'Applicants', to: '/applicants' },
        { icon: 'warning', label: 'Problem Areas', to: '/problems' },
        { icon: 'insights', label: 'Insights', to: '/insights' },
      ];
    }
    return [
      { icon: 'dashboard', label: 'Dashboard', to: '/' },
      { icon: 'warning', label: 'Problem Areas', to: '/problems' },
      { icon: 'insights', label: 'Insights', to: '/insights' },
    ];
  };

  const navigationItems = getNavItems(role);

  const handleLogout = async () => {
    await authService.signOut()
    clearCurrentUserRole()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Re-Stylized Top Left Logo (Colored Asterisk) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed left-6 top-7 z-50 w-36 h-12 flex items-center p-2"
      >
        <img src="/Assests/EduMerrge.png" alt="EduMerge" className="h-9 w-auto object-contain" />
      </motion.div>

      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="fixed left-6 top-28 hidden md:flex flex-col items-center py-8 px-3 bg-background/80 backdrop-blur-xl rounded-full sidebar-pill z-50 border border-white/40 shadow-xl shadow-black/5"
      >
        <nav className="flex flex-col gap-4">
          {navigationItems.map((item, idx) => {
            const isActive = location.pathname === item.to;
            return (
              <motion.div
                key={idx}
                className="relative flex items-center"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={item.to}
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-primary'
                    }`}
                >
                  <span className="material-symbols-outlined text-xl" data-icon={item.icon}>{item.icon}</span>
                </Link>

                {/* Tooltip Label - Precisely Centered */}
                <AnimatePresence>
                  {hoveredIdx === idx && (
                    <motion.div
                      initial={{ opacity: 0, x: 10, y: "-50%" }}
                      animate={{ opacity: 1, x: 18, y: "-50%" }}
                      exit={{ opacity: 0, x: 10, y: "-50%" }}
                      className="absolute left-full top-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-md whitespace-nowrap shadow-xl pointer-events-none"
                    >
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </nav>

        {/* Bottom Section: Sign Out */}
        <div className="flex flex-col gap-2 mt-34 items-center">
          <div className="w-8 h-[1px] bg-slate-200 my-2"></div>

          {/* Sign Out */}
          <motion.div
            className="relative flex items-center"
            onMouseEnter={() => setIsBottomHovered('logout')}
            onMouseLeave={() => setIsBottomHovered(null)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => setIsSignOutModalOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 text-error/70 hover:bg-error/10 hover:text-error shadow-sm"
            >
              <span className="material-symbols-outlined text-xl" data-icon="logout">logout</span>
            </button>
            <AnimatePresence>
              {isBottomHovered === 'logout' && (
                <motion.div
                  initial={{ opacity: 0, x: 10, y: "-50%" }}
                  animate={{ opacity: 1, x: 18, y: "-50%" }}
                  exit={{ opacity: 0, x: 10, y: "-50%" }}
                  className="absolute left-full top-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-md whitespace-nowrap shadow-xl pointer-events-none"
                >
                  Sign Out
                  <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.aside>

      {/* Global Sign Out Confirmation Modal */}
      <AnimatePresence>
        {isSignOutModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSignOutModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-[8px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-[0px_40px_80px_rgba(0,0,0,0.1)] border border-slate-200 p-8 text-center"
            >
              <div className="w-16 h-16 bg-error/5 text-error rounded-full flex items-center justify-center mx-auto mb-6 border border-error/10">
                <span className="material-symbols-outlined text-[32px]">logout</span>
              </div>
              <h3 className="text-2xl font-satoshi font-black text-blue-950">Confirm Sign Out?</h3>
              <p className="text-sm font-medium text-outline mt-2 mb-8 leading-relaxed">
                You are about to log out of the system. Any unsaved localized configurations may be lost.
              </p>
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full py-4 bg-error text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-error/20 hover:bg-red-700 transition-colors"
                >
                  Log Out Securely
                </motion.button>
                <button
                  onClick={() => setIsSignOutModalOpen(false)}
                  className="w-full py-4 text-outline font-black text-[10px] uppercase tracking-widest hover:text-blue-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
