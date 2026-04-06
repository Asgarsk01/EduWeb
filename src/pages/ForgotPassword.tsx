import { useState } from 'react'
import { Link } from 'react-router'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Logic for sending request would go here
    setIsSubmitted(true)
  }

  return (
    <main className="flex min-h-screen w-full">
      {/* Left Panel: Request Reset */}
      <section className="w-full md:w-1/2 bg-surface-container-lowest flex flex-col p-8 md:px-16 md:pt-16 md:pb-8 relative overflow-y-auto">
        <header className="flex items-center group cursor-default">
          <img src="/Assests/EduMergeFull.png" alt="EduMerge" className="h-10 w-auto object-contain" />
        </header>

        <div className="flex-grow flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full py-12 mb-20 text-center md:text-left">
            {!isSubmitted ? (
              <>
                <div className="mb-10">
                  <h1 className="font-satoshi text-4xl font-bold text-on-surface tracking-tight mb-3">Forgot Password</h1>
                  <p className="text-on-surface-variant font-body text-base">
                    Request a temporary password from your administrator by entering your registered email address.
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                      Email Address
                    </label>
                    <div className="relative group text-left">
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

                  <button
                    className="w-full py-4 rounded-full bg-primary-container text-white font-bold text-lg shadow-[0px_20px_40px_rgba(32,83,211,0.1)] hover:bg-primary transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                    type="submit"
                  >
                    Request Password
                  </button>
                </form>

                <div className="mt-8 flex justify-center w-full">
                  <Link
                    to="/login"
                    className="group text-sm font-bold text-primary hover:text-primary-container transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-8 flex flex-col items-center">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-secondary-container/20 text-secondary">
                  <span className="material-symbols-outlined text-4xl">mark_email_read</span>
                </div>
                <div>
                  <h2 className="font-satoshi text-3xl font-bold text-on-surface tracking-tight mb-4">Request Sent Successfully</h2>
                  <p className="text-on-surface-variant font-body text-base mb-2">
                    A notification has been sent to the institution administrator.
                  </p>
                  <p className="text-on-surface-variant font-body text-base">
                    The administrator will verify your account and share a temporary password via your registered email shortly.
                  </p>
                </div>
                <div className="pt-6 w-full flex justify-center">
                  <Link
                    to="/login"
                    className="group text-sm font-bold text-primary hover:text-primary-container transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left transition-all">
          <p className="text-sm font-medium text-outline/60">
            Copyright © 2025 Sellora Enterprises LTD.
          </p>
          <Link to="/privacy-policy" className="text-sm font-medium text-outline/60 mt-4 md:mt-0 cursor-pointer hover:text-primary transition-colors">
            Privacy Policy
          </Link>
        </footer>
      </section>

      {/* Right Panel: Dashboard Preview */}
      <section className="hidden md:flex w-1/2 bg-primary-container relative overflow-hidden flex-col items-center justify-center p-10 xl:p-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-white blur-[120px] opacity-[0.04]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#002f8d] blur-[100px] opacity-[0.08]"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center">
          <h2 className="font-satoshi text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Secure & Admin-verified.
          </h2>
          <p className="text-white/60 font-body text-base xl:text-lg max-w-md mb-10 leading-relaxed">
            Password resets are handled by your institution admin to keep your data safe.
          </p>

          {/* Dashboard-style illustration */}
          <div className="w-full max-w-xl pointer-events-none select-none">
            <div className="glass-card glass-highlight rounded-2xl xl:rounded-3xl p-5 xl:p-6 space-y-5">
              {/* Top bar */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/60"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400/60"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400/60"></div>
                </div>
                <span className="text-[9px] font-bold tracking-widest text-white/40 uppercase ml-2">Admin Panel</span>
              </div>

              {/* Admin Actions Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/60" style={{ fontSize: '16px' }}>group</span>
                    </div>
                    <span className="text-[8px] font-bold text-secondary-container bg-secondary-container/20 px-1.5 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="text-white font-satoshi text-xl font-black leading-none">24</div>
                  <div className="text-[8px] font-semibold text-white/40 uppercase tracking-wider">Total Users</div>
                </div>
                <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 rounded-lg bg-[#FF5734]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#FF5734]" style={{ fontSize: '16px' }}>lock_reset</span>
                    </div>
                    <span className="text-[8px] font-bold text-[#FF5734] bg-[#FF5734]/20 px-1.5 py-0.5 rounded-full">3 Pending</span>
                  </div>
                  <div className="text-white font-satoshi text-xl font-black leading-none">08</div>
                  <div className="text-[8px] font-semibold text-white/40 uppercase tracking-wider">Reset Requests</div>
                </div>
                <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/60" style={{ fontSize: '16px' }}>verified_user</span>
                    </div>
                    <span className="text-[8px] font-bold text-secondary-container bg-secondary-container/20 px-1.5 py-0.5 rounded-full">100%</span>
                  </div>
                  <div className="text-white font-satoshi text-xl font-black leading-none">5</div>
                  <div className="text-[8px] font-semibold text-white/40 uppercase tracking-wider">Approved Today</div>
                </div>
              </div>

              {/* Recent Reset Requests Table */}
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Recent Reset Requests</span>
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider">Status</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white/[0.04] rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10"></div>
                      <div>
                        <div className="text-[9px] font-bold text-white/70">john.doe@university.edu</div>
                        <div className="text-[7px] text-white/30">Admission Officer • 2 min ago</div>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/[0.04] rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10"></div>
                      <div>
                        <div className="text-[9px] font-bold text-white/70">sarah.m@university.edu</div>
                        <div className="text-[7px] text-white/30">Management • 15 min ago</div>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-secondary-container bg-secondary-container/20 px-2 py-0.5 rounded-full">Approved</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/[0.04] rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10"></div>
                      <div>
                        <div className="text-[9px] font-bold text-white/70">priya.k@university.edu</div>
                        <div className="text-[7px] text-white/30">Admission Officer • 1 hr ago</div>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-secondary-container bg-secondary-container/20 px-2 py-0.5 rounded-full">Approved</span>
                  </div>
                </div>
              </div>

              {/* Security Info Strip */}
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary-fixed" style={{ fontSize: '16px' }}>shield</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-white/70 block">Security Notice</span>
                  <span className="text-[8px] text-white/40 block truncate">Temporary passwords expire after 24 hours. Users must reset on first login.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 flex flex-col items-center">
          <span className="text-[9px] uppercase tracking-[0.4em] font-black">Secure Authentication</span>
        </div>
      </section>
    </main>
  )
}
