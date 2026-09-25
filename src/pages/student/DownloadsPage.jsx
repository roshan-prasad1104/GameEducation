import { Link } from 'react-router-dom';
import { HardDriveDownload, RefreshCw, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { catalogApi } from '../../services/api';
import { Badge, Button, Card, EmptyState, LoadingState, PageHeader } from '../../components/ui';

/** Library of chapters saved to this device, plus the offline sync queue status. */
export const DownloadsPage = () => {
  const { t, pending, online, syncing, syncNow, showToast } = useApp();
  const { data, loading, reload } = useApi(() => catalogApi.downloads(), []);

  const remove = async (chapterId) => {
    await catalogApi.removeDownload(chapterId);
    showToast(t('offline.removed'), 'info');
    reload();
  };

  if (loading && !data) return <LoadingState rows={2} />;

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title={t('downloads.title')} subtitle={t('downloads.subtitle')} />

      <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <p className="font-medium">{pending > 0 ? t('sync.pending', { count: pending }) : t('sync.allSynced')}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{online ? t('offline.online') : t('offline.willSync')}</p>
        </div>
        <Button variant="outline" leftIcon={RefreshCw} loading={syncing} disabled={!online || pending === 0} onClick={() => syncNow()}>{t('sync.now')}</Button>
      </Card>

      {data.length === 0 ? (
        <EmptyState icon={HardDriveDownload} title={t('downloads.empty')} description={t('downloads.emptyHint')}
          action={<Link to="/student/subjects"><Button variant="outline">{t('nav.subjects')}</Button></Link>} />
      ) : (
        <ul className="space-y-3">
          {data.map((b) => (
            <li key={b.key}>
              <Card className="p-4 flex items-center gap-4">
                <HardDriveDownload className="h-5 w-5 text-emerald-600 shrink-0" />
                <Link to={`/student/chapters/${b.chapterId}`} className="flex-1 min-w-0">
                  <p className="font-medium truncate">{b.chapter.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {b.chapter.subject.name} · {t('downloads.savedOn', { date: new Date(b.savedAt).toLocaleDateString() })}
                  </p>
                </Link>
                <Badge>{t('downloads.contents', { lessons: b.lessonIds.length })}</Badge>
                <Button variant="ghost" size="sm" aria-label={t('offline.remove')} onClick={() => remove(b.chapterId)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
