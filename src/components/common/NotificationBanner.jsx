import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Trophy,
  WifiOff,
  Wifi,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export const NotificationBanner = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const { message, tone } = toast;

  const getIcon = () => {
    switch (tone) {
      case 'level':
        return <Trophy className="w-5 h-5 text-yellow-400 fill-yellow-400" />;
      case 'xp':
        return <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-amber-300" />;
      case 'online':
        return <Wifi className="w-5 h-5 text-emerald-300" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-300" />;
      case 'warn':
        return <AlertTriangle className="w-5 h-5 text-amber-300" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-300" />;
      default:
        return <Info className="w-5 h-5 text-blue-300" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle" role="status" aria-live="polite">
      <div className="flex items-center gap-3 bg-slate-900/95 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md">
        {getIcon()}
        <span>{message}</span>
      </div>
    </div>
  );
};
