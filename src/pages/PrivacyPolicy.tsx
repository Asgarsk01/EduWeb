import { Link } from 'react-router'

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-body selection:bg-primary/10 selection:text-primary">
      {/* Floating Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <div className="bg-white/80 backdrop-blur-xl border border-surface-container-high rounded-2xl px-6 md:px-10 py-4 flex items-center justify-between shadow-sm">
          <Link to="/login" className="flex items-center group">
            <img src="/Assests/EduMergeFull.png" alt="EduMerge" className="h-7 w-auto object-contain" />
          </Link>
          <Link to="/login" className="text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 px-5 py-2.5 rounded-full shadow-md">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-grow flex justify-center pt-40 pb-20 px-6">
        <article className="max-w-2xl w-full">
          {/* Header Section */}
          <header className="mb-16 border-b border-surface-container-high pb-8">
            <h1 className="font-satoshi text-5xl font-black text-on-surface mb-6 tracking-tighter">Privacy Policy</h1>
            <div className="flex items-center gap-4 text-sm text-outline font-medium">
              <span>Effective Date: April 03, 2026</span>
              <span className="w-1 h-1 rounded-full bg-surface-container-high"></span>
              <span>Version 1.0</span>
            </div>
          </header>

          <div className="space-y-16">
            <section>
              <h2 className="font-satoshi text-xl font-bold text-on-surface mb-4 tracking-tight">Overview</h2>
              <p className="text-on-surface-variant leading-relaxed text-base">
                Your privacy is of critical importance to us. This document outlines the types of personal information that is received and collected by Academic Curator and how it is used. We strive for transparency and the highest standards of data protection.
              </p>
            </section>

            <section>
              <h2 className="font-satoshi text-xl font-bold text-on-surface mb-4 tracking-tight">1. Data Collection</h2>
              <p className="text-on-surface-variant leading-relaxed text-base mb-6">
                We collect information strictly necessary for the operation of the educational management platform. This information is provided to us directly by institutional administrators or through automated system processes.
              </p>
              <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest mb-2">Institutional Data</h3>
                  <p className="text-sm text-on-surface-variant">Includes names, email addresses, and administrative credentials required to provision and manage access for educational staff.</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest mb-2">Student Information</h3>
                  <p className="text-sm text-on-surface-variant">Data relating to admissions, academic progress, and institutional records as dictated by the user's role and permissions.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-satoshi text-xl font-bold text-on-surface mb-4 tracking-tight">2. Information Security</h2>
              <p className="text-on-surface-variant leading-relaxed text-base">
                Academic Curator employs advanced technical and organizational measures to safeguard your information against unauthorized access, alteration, disclosure, or destruction. We utilize industry-standard encryption and strict access control lists (ACL) based on institutional roles.
              </p>
            </section>

            <section>
              <h2 className="font-satoshi text-xl font-bold text-on-surface mb-4 tracking-tight">3. Data Retention</h2>
              <p className="text-on-surface-variant leading-relaxed text-base">
                Personal and institutional data is retained only for as long as is necessary to fulfill the purposes for which it was collected, or as required by law. Upon termination of an institutional contract, all associated data is securely decommissioned and deleted according to our standard operating procedures.
              </p>
            </section>

            <section>
              <h2 className="font-satoshi text-xl font-bold text-on-surface mb-4 tracking-tight">4. Third-Party Access</h2>
              <p className="text-on-surface-variant leading-relaxed text-base">
                We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our platform, so long as those parties agree to keep this information confidential.
              </p>
            </section>

            <section className="pt-8 border-t border-surface-container-high">
              <h2 className="font-satoshi text-xl font-bold text-on-surface mb-4 tracking-tight">Contact</h2>
              <p className="text-on-surface-variant leading-relaxed text-base mb-4">
                For inquiries regarding this policy or our data practices, please reach out to our compliance department.
              </p>
              <a href="mailto:privacy@sellora.com" className="text-primary font-bold hover:underline">
                privacy@sellora.com
              </a>
            </section>
          </div>
        </article>
      </main>

      {/* Simplified Footer */}
      <footer className="px-6 md:px-20 py-12 border-t border-surface-container-high text-center">
        <p className="text-sm text-outline font-medium">
          &copy; 2025 Sellora Enterprises LTD. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
