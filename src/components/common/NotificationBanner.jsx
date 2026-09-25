import { CheckCircle2, Info, Sparkles, TriangleAlert, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const TONES = {
  success: { Icon: CheckCircle2, cls: 'text-emerald-400' },
  xp: { Icon: Sparkles, cls: 'text-amber-400' },
  warn: { Icon: TriangleAlert, cls: 'text-amber-400' },
  error: { Icon: XCircle, cls: 'text-red-400' },
  info: { Icon: Info, cls: 'text-sky-400' },
};

/** Global toast, announced to screen readers. */
export const NotificationBanner = () => {
  const { toast } = useApp();
  if (!toast) return null;
  const { Icon, cls } = TONES[toast.tone] ?? TONES.info;
  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[70] flex justify-center" role="status" aria-live="polite">
      <div key={toast.id} className="animate-pop flex items-center gap-3 bg-slate-900/95 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md max-w-md">
        <Icon className={`h-5 w-5 shrink-0 ${cls}`} />
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
