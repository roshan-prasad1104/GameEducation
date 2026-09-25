import { Link } from 'react-router-dom';
import { Activity, BookOpen, BrainCircuit, ClipboardCheck, FileText, GraduationCap, School, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { adminApi } from '../../services/api';
import { Badge, Button, Card, ErrorState, LoadingState, PageHeader, Stat } from '../../components/ui';

export const AdminDashboardPage = () => {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => adminApi.stats(), []);

  if (loading && !data) return <LoadingState rows={2} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const r = data.usersByRole;

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin.dashboardTitle')} subtitle={t('admin.dashboardSubtitle')}
        actions={<Badge tone={data.aiServiceUp ? 'success' : 'warn'} icon={BrainCircuit}>
          {data.aiServiceUp ? t('admin.aiUp') : t('admin.aiDown')}</Badge>} />

      <section>
        <h2 className="text-sm font-semibold mb-3">{t('admin.users')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label={t('roles.STUDENT')} value={r.STUDENT} icon={GraduationCap} />
          <Stat label={t('roles.TEACHER')} value={r.TEACHER} icon={School} tone="success" />
          <Stat label={t('roles.ADMIN')} value={r.ADMIN} icon={ShieldCheck} tone="neutral" />
          <Stat label={t('admin.activeWeek')} value={data.activeStudentsThisWeek} icon={Activity} tone="violet" hint={t('admin.activeToday', { count: data.activeStudentsToday })} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">{t('admin.content')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label={t('nav.subjects')} value={data.subjects} icon={BookOpen} hint={t('admin.chapters', { count: data.chapters })} />
          <Stat label={t('admin.lessons')} value={data.lessons} icon={FileText} />
          <Stat label={t('admin.quizzes')} value={data.quizzes} icon={ClipboardCheck} tone="xp" hint={t('admin.questions', { count: data.questions })} />
          <Stat label={t('teacher.avgScore')} value={`${data.averageScore}%`} icon={TrendingUp} tone="success" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">{t('admin.engagement')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label={t('teacher.lessonsCompleted')} value={data.lessonsCompleted} icon={BookOpen} hint={t('admin.last7', { count: data.completionsLast7Days })} />
          <Stat label={t('admin.quizAttempts')} value={data.quizAttempts} icon={ClipboardCheck} hint={t('admin.last7', { count: data.attemptsLast7Days })} />
        </div>
      </section>

      <Card className="p-5 flex flex-col sm:flex-row gap-3">
        <Link to="/admin/users"><Button leftIcon={Users}>{t('admin.manageUsers')}</Button></Link>
        <Link to="/admin/content"><Button variant="outline" leftIcon={FileText}>{t('admin.manageContent')}</Button></Link>
      </Card>
    </div>
  );
};
