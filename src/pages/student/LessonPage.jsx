import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, CloudOff, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { catalogApi, learningApi } from '../../services/api';
import { Badge, Button, Card, ErrorState, LoadingState, Markdown, PageHeader } from '../../components/ui';
import { RewardPanel } from './widgets';

export const LessonPage = () => {
  const { lessonId } = useParams();
  const { t, showToast, refreshPending } = useApp();
  const { data: lesson, error, loading, reload, mutate } = useApi(() => catalogApi.lesson(lessonId), [lessonId]);
  const [completing, setCompleting] = useState(false);
  const [result, setResult] = useState({ lessonId: null });

  if (loading && !lesson) return <LoadingState rows={2} />;
  if (error && !lesson) return <ErrorState error={error} onRetry={reload} />;

  const outcome = result.lessonId === lesson.id ? result : null;

  const complete = async () => {
    setCompleting(true);
    try {
      const res = await learningApi.completeLesson(lesson.id);
      mutate((l) => ({ ...l, completed: true }));
      setResult({ lessonId: lesson.id, ...res });
      if (res.queued) {
        refreshPending();
        showToast(t('offline.savedForSync'), 'info');
      } else if (res.reward) {
        showToast(t('rewards.toast', { xp: res.reward.xpEarned }), 'xp');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        crumbs={[
          { label: lesson.subject.name, to: `/student/subjects/${lesson.subject.id}` },
          { label: lesson.chapter.title, to: `/student/chapters/${lesson.chapter.id}` },
        ]}
        title={lesson.title}
        subtitle={lesson.summary}
      />
      <div className="flex flex-wrap items-center gap-2 -mt-3">
        <Badge icon={Clock}>{t('lesson.minutes', { n: lesson.durationMinutes })}</Badge>
        {lesson.completed && <Badge tone="success" icon={CheckCircle2}>{t('lesson.completed')}</Badge>}
        {lesson.__offline && <Badge tone="warn" icon={CloudOff}>{t('offline.readingOffline')}</Badge>}
      </div>

      <Card className="p-5 sm:p-8">
        {lesson.videoUrl && (
          <div className="mb-6 aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <iframe src={lesson.videoUrl} title={lesson.title} className="w-full h-full" loading="lazy" allowFullScreen />
          </div>
        )}
        <Markdown source={lesson.content} />
      </Card>

      {outcome?.reward && <RewardPanel reward={outcome.reward} />}
      {outcome?.queued && (
        <Card className="p-4 flex items-center gap-3 border-amber-200 dark:border-amber-900/50">
          <CloudOff className="h-5 w-5 text-amber-600" />
          <p className="text-sm">{t('offline.lessonQueued')}</p>
        </Card>
      )}

      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        {!lesson.completed ? (
          <Button size="lg" leftIcon={CheckCircle2} loading={completing} onClick={complete}>
            {t('lesson.markComplete')} <span className="ml-1 inline-flex items-center text-amber-200"><Zap className="h-3.5 w-3.5" />20</span>
          </Button>
        ) : (
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> {t('lesson.completedNext')}
          </p>
        )}
        <div className="flex gap-2">
          {lesson.prevLessonId && (
            <Link to={`/student/lessons/${lesson.prevLessonId}`}><Button variant="ghost" leftIcon={ArrowLeft}>{t('lesson.previous')}</Button></Link>
          )}
          {lesson.nextLessonId ? (
            <Link to={`/student/lessons/${lesson.nextLessonId}`}><Button variant="outline" rightIcon={ArrowRight}>{t('lesson.next')}</Button></Link>
          ) : lesson.quizId ? (
            <Link to={`/student/quiz/${lesson.quizId}`}><Button variant="xp" rightIcon={ArrowRight}>{t('lesson.takeQuiz')}</Button></Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
