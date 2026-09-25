import { createElement } from 'react';
import {
  Atom, BookOpen, Calculator, CalendarCheck, ClipboardCheck, Cpu, Flame, FlaskConical, Footprints, Leaf,
  Star, Target, Trophy, Award,
} from 'lucide-react';

/** Maps icon names stored in the database to lucide components. */
const ICONS = {
  calculator: Calculator,
  atom: Atom,
  flask: FlaskConical,
  leaf: Leaf,
  cpu: Cpu,
  book: BookOpen,
  footprints: Footprints,
  'clipboard-check': ClipboardCheck,
  target: Target,
  flame: Flame,
  'calendar-check': CalendarCheck,
  trophy: Trophy,
  star: Star,
};

/** <NamedIcon name="atom" className="h-5 w-5" /> — falls back to an award icon. */
export const NamedIcon = ({ name, ...props }) => createElement(ICONS[name] ?? Award, props);
