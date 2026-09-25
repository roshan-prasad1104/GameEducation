import { CheckCircle2, LifeBuoy, Rocket } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/ui';

/** Status-coded segment label — always icon + text, never colour alone. */
const SEGMENTS = {
  NEEDS_SUPPORT: { tone: 'danger', Icon: LifeBuoy },
  ON_TRACK: { tone: 'brand', Icon: CheckCircle2 },
  ADVANCED: { tone: 'success', Icon: Rocket },
};

export const SegmentBadge = ({ segment }) => {
  const { t } = useApp();
  const s = SEGMENTS[segment] ?? SEGMENTS.ON_TRACK;
  return <Badge tone={s.tone} icon={s.Icon}>{t(`segments.${segment}`)}</Badge>;
};
