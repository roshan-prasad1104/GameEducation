import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Award, BookOpen, ClipboardList, Download, Flame, Plus, TrendingUp, TriangleAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { teacherApi } from '../../services/api';
import { Badge, Button, Card, ErrorState, LoadingState, PageHeader, Progress, Stat } from '../../components/ui';
import { SectionTitle } from '../student/widgets';
import { SegmentBadge } from './segments';
import { AssignmentModal } from './AssignmentModal';

export const StudentDetailPage = () => {
  const { studentId } = useParams();
  const { t, showToast } = useApp();
  const { data, error, loading, reload } = useApi(() => teacherApi.student(studentId), [studentId]);
  const [assignFor, setAssignFor] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      await teacherApi.studentReport(studentId);
    } catch {
      showToast(t('teacherView.reportFailed'), 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !data) return <LoadingState rows={3} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const s = data.student;

  return (
    <div className="space-y-5">
      <PageHeader crumbs={[{ label: t('nav.students'), to: '/teacher/students' }]} title={s.name} subtitle={s.email}
        actions={<><SegmentBadge segment={s.segment} />
          <Button size="sm" variant="ghost" leftIcon={Download} loading={downloading} onClick={downloadReport}>{t('teacherView.downloadPdf')}</Button>
          <Button size="sm" leftIcon={Plus} onClick={() => setAssignFor({ studentId: s.id })}>{t('assignments.assign')}</Button></>} />
      {s.segmentReason && <p className="text-sm text-slate-600 dark:text-slate-300 -mt-3">{s.segmentReason}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label={t('teacher.avgScore')} value={s.averageScore == null ? '—' : `${s.averageScore}%`} icon={TrendingUp} tone="success" hint={t('teacher.attempts', { count: s.quizAttempts })} />
        <Stat label={t('teacher.lessonsCol')} value={s.lessonsCompleted} icon={BookOpen} />
        <Stat label="XP" value={s.xp.toLocaleString()} icon={Award} tone="xp" hint={`${t('dashboard.level')} ${s.level}`} />
        <Stat label={t('teacher.activeDays')} value={s.activeDays} icon={Flame} tone="violet" hint={t('dashboard.streakDays', { count: s.streak })} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <SectionTitle icon={BookOpen}>{t('progress.bySubject')}</SectionTitle>
          <ul className="space-y-3">
            {data.subjects.map(({ subject, averageQuizScore }) => (
              <li key={subject.id}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{subject.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">{subject.completedLessons}/{subject.lessonCount}
                    {averageQuizScore != null && ` · ${t('progress.avgQuiz', { pct: averageQuizScore })}`}</span>
                </div>
                <Progress className="mt-1.5" size="sm" value={subject.progressPercent} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <SectionTitle icon={TriangleAlert}>{t('teacher.topicBreakdown')}</SectionTitle>
          {data.topics.length === 0 ? <p className="text-sm text-slate-500">{t('recs.noAnswers')}</p> : (
            <ul className="space-y-2.5">
              {data.topics.map((tp) => (
                <li key={tp.topic} className="flex items-center gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tp.topicName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tp.subjectName} · {tp.correct}/{tp.answered}</p>
                  </div>
                  <Badge tone={tp.accuracy < 50 ? 'danger' : tp.accuracy < 70 ? 'warn' : 'success'}>{tp.accuracy}%</Badge>
                  {tp.accuracy < 70 && tp.lessonId && (
                    <Button variant="ghost" size="xs" onClick={() => setAssignFor({ studentId: s.id, lessonId: tp.lessonId, title: `${t('assignments.revise')}: ${tp.lessonTitle}` })}>
                      {t('assignments.assign')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle icon={ClipboardList}>{t('progress.attempts')}</SectionTitle>
        {data.attempts.length === 0 ? <p className="text-sm text-slate-500">{t('progress.noAttempts')}</p> : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.attempts.map((a) => (
              <li key={a.attemptId} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0"><p className="font-medium truncate">{a.quizTitle}</p><p className="text-xs text-slate-500">{a.subjectName} · {new Date(a.submittedAt).toLocaleDateString()}</p></div>
                <Badge tone={a.percentage >= 80 ? 'success' : a.percentage >= 50 ? 'brand' : 'danger'}>{a.correctCount}/{a.totalQuestions} · {a.percentage}%</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AssignmentModal open={Boolean(assignFor)} initial={assignFor} onClose={() => setAssignFor(null)} onCreated={() => setAssignFor(null)} />
    </div>
  );
};
