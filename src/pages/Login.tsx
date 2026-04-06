import { useState } from 'react'
import { Link } from 'react-router'
import { getDefaultRouteForRole, setCurrentUserRole } from '../lib/session'
import { authService } from '../services/authService'
import { toast } from 'react-hot-toast'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { user, profile, error } = await authService.signIn(email, password)
      if (error) throw error
      if (!user || !profile) throw new Error('Account verified but profile not found. Contact administrator.')

      // Store Role and navigate
      setCurrentUserRole(profile.role, rememberMe)
      window.location.href = getDefaultRouteForRole(profile.role)

    } catch (err: any) {
      console.error('Login Error:', err)
      toast.error(err.message || 'Invalid credentials or network error.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen w-full">
      <section className="w-full md:w-1/2 bg-surface-container-lowest flex flex-col p-8 md:px-16 md:pt-16 md:pb-8 relative overflow-y-auto">
        <header className="flex items-center group cursor-default">
          <img src="/Assests/EduMergeFull.png" alt="EduMerge" className="h-10 w-auto object-contain" />
        </header>

        <div className="flex-grow flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full py-12 mb-20">
            <div className="mb-10 text-left">
              <h1 className="font-satoshi text-4xl font-bold text-on-surface tracking-tight mb-3">Welcome Back</h1>
              <p className="text-on-surface-variant font-body text-base">Enter your credentials to access your portal.</p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    className="w-full px-6 py-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest transition-all duration-300 outline-none text-on-surface"
                    placeholder="name@university.edu"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  Password
                </label>
                <div className="relative group">
                  <input
                    className="w-full px-6 py-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest transition-all duration-300 outline-none text-on-surface"
                    placeholder="........"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors cursor-pointer"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined" data-icon="visibility">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer"
                    type="checkbox"
                  />
                  <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface">
                    Remember Me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  title="Request password reset from admin"
                  className="text-sm font-bold text-primary hover:text-primary-container transition-colors"
                >
                  Forgot Your Password?
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  className="w-full py-4 rounded-full bg-primary-container text-white font-bold text-lg shadow-[0px_20px_40px_rgba(32,83,211,0.1)] hover:bg-primary transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Authenticating...' : 'Log In'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <footer className="mt-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left transition-all">
          <p className="text-sm font-medium text-outline/60">
            Copyright © 2025 Sellora Enterprises LTD.
          </p>
          <Link to="/privacy-policy" className="text-sm font-medium text-outline/60 mt-4 md:mt-0 cursor-pointer hover:text-primary transition-colors">
            Privacy Policy
          </Link>
        </footer>
      </section>

      <section className="hidden md:flex w-1/2 bg-primary-container relative overflow-hidden flex-col items-center justify-center p-10 xl:p-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-white blur-[120px] opacity-[0.04]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#002f8d] blur-[100px] opacity-[0.08]"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center">
          <h2 className="font-satoshi text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Your admissions command center.
          </h2>
          <p className="text-white/60 font-body text-base xl:text-lg max-w-md mb-10 leading-relaxed">
            Real-time insights, quota tracking, and program analytics — all in one place.
          </p>

          <div className="w-full max-w-xl pointer-events-none select-none">
            <div className="glass-card glass-highlight rounded-2xl xl:rounded-3xl p-5 xl:p-6 space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/60"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400/60"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400/60"></div>
                </div>
                <span className="text-[9px] font-bold tracking-widest text-white/40 uppercase ml-2">Management Brief</span>
              </div>

              <div className="grid grid-cols-4 gap-2 xl:gap-3">
                <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/60" style={{ fontSize: '16px' }}>apartment</span>
                    </div>
                    <span className="text-[8px] font-bold text-secondary-container bg-secondary-container/20 px-1.5 py-0.5 rounded-full">+12%</span>
                  </div>
                  <div className="text-white font-satoshi text-xl font-black leading-none">480</div>
                  <div className="text-[8px] font-semibold text-white/40 uppercase tracking-wider">Total Seats</div>
                </div>

                <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 rounded-lg bg-secondary-container/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary-container" style={{ fontSize: '16px' }}>person_check</span>
                    </div>
                    <span className="text-[8px] font-bold text-secondary-container bg-secondary-container/20 px-1.5 py-0.5 rounded-full">+5%</span>
                  </div>
                  <div className="text-white font-satoshi text-xl font-black leading-none">312</div>
                  <div className="text-[8px] font-semibold text-white/40 uppercase tracking-wider">Confirmed</div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-[45%] h-full bg-secondary-container rounded-full"></div>
                  </div>
                </div>

                <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/60" style={{ fontSize: '16px' }}>payments</span>
                    </div>
                    <span className="text-[8px] font-bold text-[#FF5734] bg-[#FF5734]/20 px-1.5 py-0.5 rounded-full">-2%</span>
                  </div>
                  <div className="text-white font-satoshi text-lg font-black leading-none">312<span className="text-white/40 text-sm font-medium">/360</span></div>
                  <div className="text-[8px] font-semibold text-white/40 uppercase tracking-wider">Fee Status</div>
                </div>

                <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/60" style={{ fontSize: '16px' }}>donut_large</span>
                    </div>
                    <span className="text-[8px] font-bold text-secondary-container bg-secondary-container/20 px-1.5 py-0.5 rounded-full">+8%</span>
                  </div>
                  <div className="text-white font-satoshi text-xl font-black leading-none">74%</div>
                  <div className="text-[8px] font-semibold text-white/40 uppercase tracking-wider">Capacity</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Program Progress</span>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider">Details</span>
                  </div>
                  {[
                    ['CSE', '55%', '30%', '15%'],
                    ['ECE', '40%', '35%', '25%'],
                    ['MBA', '50%', '25%', '25%'],
                  ].map(([name, confirmed, reserved, vacant]) => (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-semibold text-white/60">{name}</span>
                        <span className="text-[8px] font-bold text-white/40">{name === 'MBA' ? '60' : name === 'ECE' ? '80' : '100'}</span>
                      </div>
                      <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden flex">
                        <div className="h-full bg-primary rounded-full" style={{ width: confirmed }}></div>
                        <div className="h-full bg-primary/40" style={{ width: reserved }}></div>
                        <div className="h-full bg-white/[0.08]" style={{ width: vacant }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3">
                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Quota Distribution</span>
                  <div className="grid grid-cols-4 gap-1 text-[7px] font-bold text-white/30 uppercase tracking-widest border-b border-white/[0.06] pb-1.5">
                    <span>Program</span>
                    <span className="text-center">KCET</span>
                    <span className="text-center">COMEDK</span>
                    <span className="text-center">Mgmt</span>
                  </div>
                  {[
                    ['CSE', '35/40', '15/30', '20/30'],
                    ['ECE', '25/40', '09/30', '14/30'],
                    ['MBA', '37/40', '23/30', '06/30'],
                  ].map(([program, kcet, comedk, management]) => (
                    <div key={program} className="grid grid-cols-4 gap-1 text-[9px] font-semibold text-white/60 items-center py-1">
                      <span className="font-bold text-white/80">{program}</span>
                      <span className="text-center">{kcet}</span>
                      <span className="text-center">{comedk}</span>
                      <span className="text-center">{management}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary-fixed" style={{ fontSize: '10px' }}>auto_awesome</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-white/70 block">AI Briefing Preview</span>
                  <span className="text-[8px] text-white/40 block truncate">Management quota for CSE is at critical mass (96%). Reallocation of surplus advised.</span>
                </div>
                <div className="bg-white/[0.08] border border-white/[0.06] rounded-lg px-3 py-1.5 flex items-center gap-1 shrink-0">
                  <span className="text-[8px] font-bold text-white/50">View Full Analysis</span>
                  <span className="material-symbols-outlined text-white/50 text-[12px]">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 flex flex-col items-center">
          <span className="text-[9px] uppercase tracking-[0.4em] font-black">Management Command Center</span>
        </div>
      </section>
    </main>
  )
}
