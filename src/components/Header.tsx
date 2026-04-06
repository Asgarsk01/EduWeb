import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { getCurrentUserRole } from '../lib/session'
import { authService } from '../services/authService'
import { notificationService, type Notification } from '../services/notificationService'
import { searchService, type SearchResult } from '../services/searchService'
import { useDebounce } from '../hooks/useDebounce'

// Map notification type to icon + color scheme
const typeConfig: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  INFO:    { icon: 'info',           bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100' },
  WARNING: { icon: 'warning',        bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' },
  SUCCESS: { icon: 'check_circle',   bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  URGENT:  { icon: 'error',          bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100' },
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export const Header = () => {
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Search States
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [userName, setUserName] = useState<string>('User')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)

  // Handle Keyboard Shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Execute Search Effect
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.length > 1) {
        setIsSearching(true)
        setShowSearchDropdown(true)
        const { data, error } = await searchService.executeGlobalSearch(debouncedSearchTerm)
        if (!error && data) {
          setSearchResults(data)
        }
        setIsSearching(false)
      } else {
        setSearchResults([])
        setShowSearchDropdown(false)
      }
    }
    performSearch()
  }, [debouncedSearchTerm])

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
        const { profile } = await authService.getCurrentUser();
        if (profile) setUserName(profile.full_name);
    })();
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true)
    const { data } = await notificationService.getMyNotifications()
    setNotifications(data)
    setLoadingNotifs(false)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Realtime subscription: when a new notification arrives, refetch
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToNewNotifications(() => {
      fetchNotifications()
    })
    return unsubscribe
  }, [fetchNotifications])

  const hasUnreadNotifications = notifications.some(n => !n.is_read)
  const unreadCount = notifications.filter(n => !n.is_read).length
  const role = getCurrentUserRole()

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const handleResultClick = (route: string) => {
    navigate(route)
    setSearchTerm('')
    setShowSearchDropdown(false)
    setIsSearchOpen(false)
  }

  const formattedDate = currentDate.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Group results by item_type
  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.item_type]) acc[result.item_type] = []
    acc[result.item_type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="sticky top-0 z-[100] bg-background/80 backdrop-blur-xl flex justify-between items-center w-full px-12 py-6"
    >
      {/* Left Section: Context */}
      <div className="flex-1 flex items-center justify-start">
        <div className="text-left">
          <h1 className="text-2xl font-satoshi font-black text-on-surface leading-tight text-left">
            Hello, {userName}!
          </h1>
          <div className="flex items-center gap-2 mt-1.5 font-bold uppercase tracking-wider text-[9px]">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/5 rounded-full border border-primary/10 text-primary">
              <span className="material-symbols-outlined text-[10px]" data-icon="update">update</span>
              <span>{formattedDate}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-outline/20"></span>
            <div className="flex items-center gap-1 text-outline">
              <span className="material-symbols-outlined text-[10px]" data-icon="verified_user">verified_user</span>
              <span>{role} Level Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section: Spacer for layout balance */}
      <div className="flex-1" />

      {/* Right Section: Tools */}
      <div className="flex-1 flex items-center justify-end gap-4">

        {/* Optimized Search Bar */}
        <div className="relative flex items-center">
          <motion.div
            initial={false}
            animate={{
              width: isSearchOpen ? 320 : 48
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex items-center h-12 rounded-full overflow-hidden border border-surface-container shadow-sm px-1 bg-white relative"
          >
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex-1 flex items-center pr-10"
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Anything..."
                    className="w-full h-full pl-5 bg-transparent outline-none text-sm font-medium text-on-surface caret-primary"
                    autoFocus
                  />
                  
                  {/* Search Interaction Hints */}
                  <div className="absolute right-12 flex items-center gap-2 pointer-events-none">
                    {isSearching ? (
                      <div className="w-4 h-4 border-2 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                    ) : searchTerm === '' ? (
                      <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400">
                        <span>⌘</span>
                        <span>K</span>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                        className="pointer-events-auto text-slate-300 hover:text-slate-500"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              layout
              onClick={() => {
                if (isSearchOpen && searchTerm !== '') {
                  setSearchTerm('');
                } else {
                  setIsSearchOpen(!isSearchOpen);
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`absolute right-1 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isSearchOpen ? 'bg-primary text-white shadow-lg' : 'bg-transparent text-outline'}`}
            >
              <span className="material-symbols-outlined text-xl" data-icon="search">search</span>
            </motion.button>
          </motion.div>

          {/* Search Dropdown Results */}
          <AnimatePresence>
            {showSearchDropdown && isSearchOpen && (
              <>
                <div className="fixed inset-0 z-[110]" onClick={() => setShowSearchDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 mt-3 w-[400px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 z-[120] overflow-hidden"
                >
                  <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                    {Object.keys(groupedResults).length === 0 ? (
                      <div className="py-12 flex flex-col items-center text-center px-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                          <span className="material-symbols-outlined text-slate-300">search_off</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">No results found for "{searchTerm}"</p>
                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Try searching for names, application IDs, or email addresses.</p>
                      </div>
                    ) : (
                      Object.entries(groupedResults).map(([type, items]) => (
                        <div key={type} className="border-b last:border-0 border-slate-50">
                          <div className="px-5 py-2.5 bg-slate-50/50 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{type}s</span>
                            <span className="text-[9px] font-bold text-slate-300">{items.length} matches</span>
                          </div>
                          <div className="py-1">
                            {items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleResultClick(item.route)}
                                className="w-full px-5 py-3.5 flex flex-col text-left hover:bg-primary/[0.03] group transition-colors"
                              >
                                <span className="font-satoshi font-black text-[13px] text-slate-900 group-hover:text-primary transition-colors">{item.title}</span>
                                <span className="text-[11px] font-medium text-slate-500 mt-0.5">{item.subtitle}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <span className="px-1 py-0.5 rounded border border-slate-200 bg-white shadow-sm font-mono tracking-tighter">↵</span>
                        <span>Select</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <span className="px-1 py-0.5 rounded border border-slate-200 bg-white shadow-sm font-mono tracking-tighter">↑↓</span>
                        <span>Navigate</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">EduMerge Engine</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Dropdown */}
        <div className="relative">
          <motion.button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center border border-surface-container transition-colors relative shadow-sm ${isNotifOpen ? 'bg-surface-container text-primary shadow-inner' : 'bg-white text-outline hover:text-primary'}`}
          >
            <span className="material-symbols-outlined text-xl" data-icon="notifications">notifications</span>
            {hasUnreadNotifications && (
              <div className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[9px] font-black text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </div>
            )}
          </motion.button>

          <AnimatePresence>
            {isNotifOpen && (
              <>
                {/* Click-away overlay */}
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-3 w-[380px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-200 z-50 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h4 className="font-satoshi font-black text-slate-900 text-[15px] tracking-tight">Notifications</h4>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">
                        {unreadCount > 0 ? `${unreadCount} Unread` : 'All Clear'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest transition-all"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                    {loadingNotifs ? (
                      <div className="py-16 flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-3 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Loading alerts...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-16 flex flex-col items-center gap-3 text-center px-8">
                        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                          <span className="material-symbols-outlined text-3xl text-slate-300">notifications_off</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No notifications yet</p>
                        <p className="text-[11px] text-slate-400 font-medium">System alerts will appear here automatically.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const config = typeConfig[notif.type] || typeConfig.INFO
                        return (
                          <button
                            key={notif.id}
                            onClick={() => handleMarkRead(notif.id)}
                            className={`w-full flex gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors text-left ${!notif.is_read ? 'bg-primary/[0.02]' : ''}`}
                          >
                            <div className={`w-10 h-10 ${config.bg} ${config.text} rounded-full flex items-center justify-center shrink-0 border ${config.border}`}>
                              <span className="material-symbols-outlined text-[20px]">{config.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="font-satoshi font-black text-[13px] text-slate-900 truncate">{notif.title}</h5>
                                {!notif.is_read && (
                                  <div className="w-2 h-2 bg-primary rounded-full shrink-0"></div>
                                )}
                              </div>
                              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{notif.message}</p>
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-2 block">{timeAgo(notif.created_at)}</span>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  )
}
