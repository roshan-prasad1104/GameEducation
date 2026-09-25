import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { catalogApi } from '../../services/api';
import { EmptyState, ErrorState, LoadingState, PageHeader, StaleBanner } from '../../components/ui';
import { BookOpen } from 'lucide-react';
import { SubjectTile } from './widgets';

export const SubjectsPage = () => {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => catalogApi.subjects(), []);

  if (loading && !data) return <LoadingState rows={1} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <PageHeader title={t('subjects.title')} subtitle={t('subjects.subtitle')} />
      <StaleBanner savedAt={data.__stale} />
      {data.length === 0 ? (
        <EmptyState icon={BookOpen} title={t('subjects.empty')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((s) => <SubjectTile key={s.id} subject={s} />)}
        </div>
      )}
    </div>
  );
};
