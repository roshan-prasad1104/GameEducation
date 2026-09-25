import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, CircleDot, Clock, CloudDownload, HardDriveDownload, Play, Trash2, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { catalogApi } from '../../services/api';
import { Badge, Button, Card, ErrorState, LoadingState, PageHeader, StaleBanner } from '../../components/ui';

/** Offline download toggle for one chapter (lessons + quiz into IndexedDB). */
export const DownloadButton = ({ chapterId }) => {
  const { t, online, showToast } = useApp();
  const [downloaded, setDownloaded] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    catalogApi.isDownloaded(chapterId).then((v) => { if (active) setDownloaded(v); });
    return () => { active = false; };
  }, [chapterId]);

  const toggle = async () => {
    setBusy(true);
    try {
      if (downloaded) {
        await catalogApi.removeDownload(chapterId);
        setDownloaded(false);
        showToast(t('offline.removed'), 'info');
      } else {
        await catalogApi.download(chapterId);
        setDownloaded(true);
        showToast(t('offline.downloaded'), 'success');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (downloaded === null) return null;
  return downloaded ? (
    <div className="inline-flex items-center gap-1.5">
      <Badge tone="success" icon={HardDriveDownload}>{t('offline.availableOffline')}</Badge>
      <Button variant="ghost" size="sm" leftIcon={Trash2} loading={busy} onClick={toggle} aria-label={t('offline.remove')}>
        {t('offline.remove')}
      </Button>
    </div>
  ) : (
    <Button variant="outline" size="sm" leftIcon={CloudDownload} loading={busy} disabled={!online} onClick={toggle}>
      {t('offline.download')}
    </Button>
  );
};

export const ChapterPage = () => {
  const { chapterId } = useParams();
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => catalogApi.chapter(chapterId), [chapterId]);

  if (loading && !data) return <LoadingState rows={2} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const allDone = data.lessons.length > 0 && data.completedLessons === data.lessons.length;
  const nextLesson = data.lessons.find((l) => !l.completed) ?? data.lessons[0];

  return (
    <div className="space-y-5">
      <PageHeader
        crumbs={[{ label: t('nav.subjects'), to: '/student/subjects' }, { label: data.subject.name, to: `/student/subjects/${data.subject.id}` }]}
        eyebrow={t('chapter.label', { n: data.position })}
        title={data.title}
        subtitle={data.description}
        actions={<DownloadButton chapterId={data.id} />}
      />
      <StaleBanner savedAt={data.__stale} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold">{t('chapter.lessons')}</h2>
          <ol className="space-y-2">
            {data.lessons.map((l) => (
              <li key={l.id}>
                <Link to={`/student/lessons/${l.id}`} className="card card-hover p-4 flex items-center gap-4">
                  {l.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <CircleDot className="h-5 w-5 text-brand-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{l.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{l.summary}</p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    <Clock className="h-3.5 w-3.5" />{t('lesson.minutes', { n: l.durationMinutes })}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          {nextLesson && !allDone && (
            <Link to={`/student/lessons/${nextLesson.id}`}><Button leftIcon={Play} className="mt-2">{t('chapter.continueLesson')}</Button></Link>
          )}
        </div>

        {data.quiz && (
          <Card premium className="p-5 h-fit space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">{t('chapter.quiz')}</p>
              <p className="mt-1 font-semibold">{data.quiz.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{data.quiz.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{t('quiz.questions', { count: data.quiz.questionCount })}</Badge>
              <Badge icon={Clock}>{t('lesson.minutes', { n: Math.round(data.quiz.timeLimitSeconds / 60) })}</Badge>
              {data.quiz.bestPercentage != null && <Badge tone="success">{t('chapter.bestScore', { pct: data.quiz.bestPercentage })}</Badge>}
            </div>
            {!allDone && <p className="text-xs text-slate-500 dark:text-slate-400">{t('chapter.quizTip')}</p>}
            <Link to={`/student/quiz/${data.quiz.id}`} className="block">
              <Button variant="xp" className="w-full" leftIcon={Zap}>
                {data.quiz.bestPercentage != null ? t('chapter.retakeQuiz') : t('chapter.startQuiz')}
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};
