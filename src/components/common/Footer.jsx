import React from 'react';
import { GraduationCap, Heart, WifiOff, ShieldCheck, Mail, Phone, MapPin, Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Footer = () => {
  const { setActiveTab, t } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1: Brand & Rural Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-emerald-400 p-0.5">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">ShikshaSetu</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bridging the digital divide in rural education. Providing interactive, offline-ready, gamified learning for Grades 6 to 12.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl w-fit">
              <WifiOff className="w-4 h-4 text-emerald-400" />
              <span>Offline SD-Card Sync Ready</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Quick Access</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('dashboard')} className="hover:text-blue-400 transition-colors">
                  {t('studentDashboard')}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('courses')} className="hover:text-blue-400 transition-colors">
                  {t('courses')} (Grades 6–12)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('achievements')} className="hover:text-blue-400 transition-colors">
                  {t('achievements')} & Rewards
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('leaderboard')} className="hover:text-blue-400 transition-colors">
                  Village & Regional Leaderboard
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('teacher')} className="hover:text-blue-400 transition-colors text-emerald-400 font-semibold">
                  Teacher & Panchayat Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Subjects Covered */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Subjects Covered</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Mathematics (Algebra, Geometry, Arithmetic)</li>
              <li>• General Science & Biology</li>
              <li>• Physics & Basic Circuits</li>
              <li>• Chemistry & Environmental Science</li>
              <li>• English Grammar & Regional Literacy</li>
            </ul>
          </div>

          {/* Col 4: Contact & Rural Helpline */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Rural EdTech Support</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Toll-Free Helpline: 1800-SHIKSHA-RURAL</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@shikshasetu.org</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Panchayat Digital Hubs, Sundargarh & Regional Centers</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>NCERT Aligned Curriculum</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 ShikshaSetu Rural Education Initiative. Free for all rural students.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for rural schools across India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
