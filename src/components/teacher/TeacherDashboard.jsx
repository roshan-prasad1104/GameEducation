import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { teacherApi } from '../../services/api';
import { BarChart, ErrorState, LoadingState } from '../ui';
import {
  Users,
  AlertTriangle,
  Plus,
  FileCheck,
  Search,
  BarChart3,
  Clock,
  Sparkles,
  Trash2,
  Loader2,
  Download
} from 'lucide-react';

/** Sidebar routes map onto the dashboard's tabs, so every nav item lands on a working view. */
const TAB_FOR_PATH = {
  '/teacher/dashboard': 'roster',
  '/teacher/classes': 'roster',
  '/teacher/weak-topics': 'weakTopics',
  '/teacher/assignments': 'assignments',
  '/teacher/reports': 'reports',
};
const PATH_FOR_TAB = { roster: '/teacher/classes', weakTopics: '/teacher/weak-topics', assignments: '/teacher/assignments', reports: '/teacher/reports' };

const STATUS = {
  NEEDS_SUPPORT: { labelKey: 'teacherView.statusNeeds', cls: 'bg-rose-100 text-rose-700' },
  ON_TRACK: { labelKey: 'teacherView.statusConsistent', cls: 'bg-blue-100 text-blue-700' },
  ADVANCED: { labelKey: 'teacherView.statusTop', cls: 'bg-emerald-100 text-emerald-700' },
};

const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const dueLabel = (iso, t) => {
  if (!iso) return t('teacherView.noDueDate');
  const days = Math.round((new Date(iso) - new Date(new Date().toISOString().slice(0, 10))) / 86400000);
  return days < 0 ? t('teacherView.overdue') : days === 0 ? t('teacherView.dueToday') : t(days === 1 ? 'teacherView.inDay' : 'teacherView.inDays', { n: days });
};

const TabButton = ({ active, onClick, icon: Icon, iconCls, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? '' : iconCls ?? ''}`} />
    <span>{children}</span>
  </button>
);

export const TeacherDashboard = () => {
  const { user, showToast, t, language } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = TAB_FOR_PATH[location.pathname] ?? 'roster';
  const [searchQuery, setSearchQuery] = useState('');
  const [classId, setClassId] = useState(''); // '' = all of the teacher's classes

  const classes = useApi(() => teacherApi.classes(), []);
  const overview = useApi(() => teacherApi.overview(classId), [classId]);
  const students = useApi(() => teacherApi.students(classId), [classId]);
  const weak = useApi(() => teacherApi.weakTopics(classId), [classId]);
  const assignments = useApi(() => teacherApi.assignments(classId), [classId]);
  const outline = useApi(() => (activeTab === 'assignments' ? teacherApi.outline() : Promise.resolve(null)), [activeTab]);

  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [target, setTarget] = useState(''); // "lesson:12" | "quiz:3"
  const [dueIn, setDueIn] = useState(3);
  const [assignTo, setAssignTo] = useState(''); // '' = whole class, 'student:<id>' or 'class:<id>'
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [exporting, setExporting] = useState(null);

  if (overview.loading && !overview.data) return <LoadingState rows={3} />;
  if (overview.error && !overview.data) return <ErrorState error={overview.error} onRetry={overview.reload} />;
  const o = overview.data;
  const roster = students.data ?? [];
  const myClasses = classes.data ?? [];
  const selectedClass = myClasses.find((c) => String(c.id) === String(classId))
    ?? (myClasses.length === 1 ? myClasses[0] : null);
  /** Class for whole-class work: the chosen one, or the only one (the server rejects ambiguity). */
  const wholeClassId = selectedClass?.id ?? null;

  const filteredStudents = roster.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.weakestTopic ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createAssignment = async (body) => {
    const created = await teacherApi.createAssignment(body);
    assignments.reload();
    return created;
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignmentTitle.trim()) { showToast(t('teacherView.enterTitle'), 'warn'); return; }
    if (!target) { showToast(t('teacherView.chooseTarget'), 'warn'); return; }
    const [kind, id] = target.split(':');
    const [toKind, toId] = assignTo ? assignTo.split(':') : ['class', wholeClassId];
    setSaving(true);
    try {
      await createAssignment({
        title: newAssignmentTitle.trim(),
        lessonId: kind === 'lesson' ? Number(id) : null,
        quizId: kind === 'quiz' ? Number(id) : null,
        studentId: toKind === 'student' ? Number(toId) : null,
        classId: toKind === 'class' && toId ? Number(toId) : null,
        dueDate: inDays(Number(dueIn)),
      });
      setNewAssignmentTitle('');
      setTarget('');
      showToast(toKind === 'student' ? t('teacherView.sentStudent') : t('teacherView.sentAll'), 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = async (report) => {
    setExporting(report);
    try {
      await teacherApi.exportCsv(report, classId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting(null);
    }
  };

  const assignRemedial = async (wt) => {
    setAssigning(wt.topic);
    try {
      await createAssignment({ title: `Revise: ${wt.lessonTitle}`, lessonId: wt.lessonId, dueDate: inDays(3), classId: wholeClassId,
        note: `Class accuracy on ${wt.topicName} is ${wt.accuracy}%.` });
      showToast(t('teacherView.remedialAssigned', { topic: wt.topicName }), 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAssigning(null);
    }
  };

  const removeAssignment = async (id) => {
    if (!window.confirm(t('assignments.confirmDelete'))) return;
    try {
      await teacherApi.deleteAssignment(id);
      assignments.reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const activePct = o.totalStudents ? Math.round((100 * o.activeStudents) / o.totalStudents) : 0;
  const dayFmt = (iso) => new Date(iso).toLocaleDateString(`${language}-IN`, { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-8 pb-16">

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            {t('teacherView.eyebrow')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            {t('teacherView.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {user?.name} · {selectedClass ? selectedClass.name : t('classes.allClasses')} · {t('teacherView.studentsSegments', { count: o.totalStudents, model: o.segmentModel })}
          </p>
          {selectedClass && (
            <p className="text-xs text-slate-300 mt-1">
              {t('classes.codeForStudents')} <span className="font-mono font-bold text-emerald-300 tracking-widest">{selectedClass.joinCode}</span>
            </p>
          )}
          {myClasses.length === 0 && classes.data && (
            <p className="text-xs text-amber-300 mt-1">{t('classes.noClassYet')}</p>
          )}
          {myClasses.length > 1 && (
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setAssignTo(''); }} aria-label={t('classes.class')}
              className="mt-3 px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white">
              <option value="" className="text-slate-900">{t('classes.allClasses')}</option>
              {myClasses.map((c) => <option key={c.id} value={c.id} className="text-slate-900">{c.name} · {c.schoolName}</option>)}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
          <div className="text-center px-2">
            <div className="text-xl font-extrabold text-emerald-400">{o.totalStudents}</div>
            <div className="text-[10px] font-semibold text-slate-300">{t('teacherView.enrolled')}</div>
          </div>
          <div className="h-6 w-[1px] bg-white/20" />
          <div className="text-center px-2">
            <div className="text-xl font-extrabold text-blue-400">{activePct}%</div>
            <div className="text-[10px] font-semibold text-slate-300">{t('teacherView.activeWeek')}</div>
          </div>
          <div className="h-6 w-[1px] bg-white/20" />
          <div className="text-center px-2">
            <div className="text-xl font-extrabold text-amber-400">{o.averageScore ?? '—'}{o.averageScore != null && '%'}</div>
            <div className="text-[10px] font-semibold text-slate-300">{t('teacherView.avgQuiz')}</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <TabButton active={activeTab === 'roster'} onClick={() => navigate(PATH_FOR_TAB.roster)} icon={Users}>
          {t('teacherView.tabRoster')}
        </TabButton>
        <TabButton active={activeTab === 'weakTopics'} onClick={() => navigate(PATH_FOR_TAB.weakTopics)} icon={AlertTriangle} iconCls="text-amber-500">
          {t('teacherView.tabWeak', { count: weak.data?.length ?? 0 })}
        </TabButton>
        <TabButton active={activeTab === 'assignments'} onClick={() => navigate(PATH_FOR_TAB.assignments)} icon={FileCheck} iconCls="text-emerald-500">
          {t('teacherView.tabAssign')}
        </TabButton>
        <TabButton active={activeTab === 'reports'} onClick={() => navigate(PATH_FOR_TAB.reports)} icon={BarChart3} iconCls="text-indigo-500">
          {t('teacherView.tabReports')}
        </TabButton>
      </div>

      {activeTab === 'roster' && (
        <div className="space-y-6">

          {/* Search bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('teacherView.searchPlaceholder')}
              aria-label={t('teacherView.searchAria')}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Student Roster Table */}
          <div className="glass-card rounded-3xl overflow-x-auto border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="min-w-[640px]">
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 font-bold text-xs text-slate-500 dark:text-slate-400 grid grid-cols-12 gap-2 uppercase tracking-wider">
                <span className="col-span-4">{t('teacherView.colName')}</span>
                <span className="col-span-2 text-center">{t('teacherView.colActive')}</span>
                <span className="col-span-2 text-center">{t('teacherView.avgQuiz')}</span>
                <span className="col-span-2 text-center">{t('teacherView.colStatus')}</span>
                <span className="col-span-2 text-right pr-4">{t('teacherView.colWeak')}</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.loading && !students.data && <p className="p-4 text-xs text-slate-500">{t('teacherView.loadingStudents')}</p>}
                {filteredStudents.map((st) => {
                  const status = STATUS[st.segment] ?? STATUS.ON_TRACK;
                  return (
                    <button key={st.id} onClick={() => navigate(`/teacher/students/${st.id}`)}
                      title={st.segmentReason ?? ''}
                      className="w-full text-left grid grid-cols-12 gap-2 items-center p-4 text-xs font-semibold hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="col-span-4 font-bold text-slate-900 dark:text-white text-sm">
                        {st.name} <span className="text-[11px] font-normal text-slate-400">{t('teacherView.gradeParen', { grade: st.gradeLevel ?? '—' })}</span>
                        <span className="block text-[11px] font-normal text-slate-400">{t('teacherView.studentStats', { lessons: st.lessonsCompleted, quizzes: st.quizAttempts, xp: st.xp })}</span>
                      </div>
                      <span className="col-span-2 text-center text-emerald-600 font-bold">{st.activeDays}</span>
                      <span className="col-span-2 text-center text-blue-600 font-bold">{st.averageScore == null ? '—' : `${st.averageScore}%`}</span>
                      <div className="col-span-2 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${status.cls}`}>
                          {t(status.labelKey)}
                        </span>
                      </div>
                      <span className="col-span-2 text-right pr-4 text-amber-600 dark:text-amber-400 font-medium">{st.weakestTopic ?? t('teacherView.none')}</span>
                    </button>
                  );
                })}
                {students.data && filteredStudents.length === 0 && <p className="p-4 text-xs text-slate-500">{t('teacherView.noMatching')}</p>}
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'weakTopics' && (
        weak.data?.length === 0 ? (
          <p className="text-sm text-slate-500">{t('teacherView.noWeak')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(weak.data ?? []).map((wt) => (
              <div key={wt.topic} className="glass-card p-6 rounded-3xl space-y-4 border border-amber-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
                    {wt.subjectName}
                  </span>
                  <span className="text-xs font-bold text-rose-500">
                    {t('teacherView.errorRate', { pct: 100 - wt.accuracy })}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {wt.topicName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t('teacherView.answersStats', { correct: wt.correct, answered: wt.answered, count: wt.studentsStruggling })}
                    {wt.lessonTitle && <> <strong>{t('teacherView.recommendedAction')}</strong> {t('teacherView.reviseLesson', { title: wt.lessonTitle })}</>}
                  </p>
                </div>

                {wt.lessonId && (
                  <button
                    onClick={() => assignRemedial(wt)}
                    disabled={assigning === wt.topic}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {assigning === wt.topic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{t('teacherView.assignRemedial')}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">

          {/* Create Assignment Form */}
          <form onSubmit={handleCreateAssignment} className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>{t('teacherView.broadcastNew')}</span>
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newAssignmentTitle}
                onChange={(e) => setNewAssignmentTitle(e.target.value)}
                placeholder={t('teacherView.titlePlaceholder')}
                aria-label={t('teacherView.titleAria')}
                maxLength={160}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold text-xs rounded-xl shadow disabled:opacity-60"
              >
                {saving ? t('teacherView.sending') : t('teacherView.broadcast')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label={t('teacherView.targetAria')}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white">
                <option value="">{t('teacherView.chooseTargetOption')}</option>
                {(outline.data ?? []).map((s) => (
                  <optgroup key={s.id} label={s.name}>
                    {s.chapters.flatMap((c) => [
                      ...c.lessons.map((l) => <option key={`l${l.id}`} value={`lesson:${l.id}`}>📖 {l.title}</option>),
                      ...(c.quiz ? [<option key={`q${c.quiz.id}`} value={`quiz:${c.quiz.id}`}>📝 {c.quiz.title}</option>] : []),
                    ])}
                  </optgroup>
                ))}
              </select>
              <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} aria-label={t('assignments.assignTo')}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white">
                {selectedClass
                  ? <option value="">{t('teacherView.allStudents')}</option>
                  : <option value="">{t('classes.chooseClass')}</option>}
                {!selectedClass && myClasses.map((c) => (
                  <option key={`c${c.id}`} value={`class:${c.id}`}>{t('classes.wholeClass', { name: c.name })}</option>
                ))}
                {roster.map((s) => <option key={s.id} value={`student:${s.id}`}>{s.name}</option>)}
              </select>
              <select value={dueIn} onChange={(e) => setDueIn(e.target.value)} aria-label={t('teacherView.dueAria')}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white">
                {[1, 3, 7, 14].map((d) => <option key={d} value={d}>{t(d > 1 ? 'teacherView.dueInDays' : 'teacherView.dueInDay', { n: d })}</option>)}
              </select>
            </div>
          </form>

          {/* Active Assignments List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(assignments.data ?? []).map((ass) => (
              <div key={ass.id} className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                    {ass.lessonId ? t('assignments.kind.lesson') : t('assignments.kind.quiz')}{ass.studentName ? ` · ${ass.studentName}` : myClasses.length > 1 && ass.className ? ` · ${ass.className}` : ''}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {dueLabel(ass.dueDate, t)}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {ass.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {t(ass.targetCount === 1 ? 'teacherView.completedByOne' : 'teacherView.completedBy', { done: ass.completedCount, total: ass.targetCount })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${ass.targetCount ? Math.round((ass.completedCount / ass.targetCount) * 100) : 0}%` }}
                    />
                  </div>
                  <button onClick={() => removeAssignment(ass.id)} aria-label={t('teacherView.deleteAria')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {assignments.data?.length === 0 && <p className="text-xs text-slate-500">{t('teacherView.noAssignments')}</p>}
          </div>

        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-auto">{t('teacherView.exportLabel')}</span>
            {[['students', t('teacherView.studentReport')], ['topics', t('teacherView.topicReport')]].map(([report, label]) => (
              <button key={report} type="button" onClick={() => exportCsv(report)} disabled={exporting !== null}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
                {exporting === report ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('lessonsCompleted'), value: o.lessonsCompleted, cls: 'text-emerald-500' },
              { label: t('teacherView.quizAttempts'), value: o.quizAttempts, cls: 'text-blue-600' },
              { label: t('teacherView.needsSupport'), value: o.needsSupport, cls: 'text-rose-500' },
              { label: t('teacherView.activeWeek'), value: `${o.activeStudents}/${o.totalStudents}`, cls: 'text-amber-500' },
            ].map((k) => (
              <div key={k.label} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <div className={`text-2xl font-black ${k.cls}`}>{k.value}</div>
                <div className="text-xs font-semibold text-slate-500">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('teacherView.avgBySubject')}</h3>
              <BarChart horizontal labels={o.subjectPerformance.map((s) => s.subjectName)}
                series={[{ label: t('teacherView.avgScore'), data: o.subjectPerformance.map((s) => s.averageScore) }]}
                valueSuffix="%" max={100} ariaLabel={t('teacherView.avgAria')} />
            </div>
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('teacherView.distribution')}</h3>
              <BarChart labels={o.scoreDistribution.map((b) => b.label)}
                series={[{ label: t('teacher.attemptsLabel'), data: o.scoreDistribution.map((b) => b.count) }]}
                ariaLabel={t('teacherView.distAria')} />
            </div>
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('teacherView.activity14')}</h3>
              <BarChart labels={o.activity.map((p) => dayFmt(p.date))}
                series={[
                  { label: t('progress.lessons'), data: o.activity.map((p) => p.lessons) },
                  { label: t('progress.quizzes'), data: o.activity.map((p) => p.quizzes) },
                ]}
                ariaLabel={t('teacherView.activityAria')} />
            </div>
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('teacherView.completionBySubject')}</h3>
              <BarChart horizontal labels={o.subjectPerformance.map((s) => s.subjectName)}
                series={[{ label: t('teacher.completionLabel'), data: o.subjectPerformance.map((s) => s.completionPercent) }]}
                valueSuffix="%" max={100} ariaLabel={t('teacherView.completionAria')} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
