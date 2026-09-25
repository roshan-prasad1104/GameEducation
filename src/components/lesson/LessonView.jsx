import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { catalogApi, learningApi } from '../../services/api';
import { ErrorState, LoadingState, Markdown } from '../ui';
import {
  DownloadCloud,
  CheckCircle2,
  Zap,
  ArrowLeft,
  ArrowRight,
  FileText,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  BookMarked,
  CloudOff,
  Loader2
} from 'lucide-react';

const SPEECH_LANG = { en: 'en-IN', hi: 'hi-IN', or: 'or-IN', te: 'te-IN' };

/** Splits lesson markdown into the body and its trailing "### Key points" bullet list. */
const splitKeyPoints = (content = '') => {
  const m = content.match(/\n#{2,3}\s*Key points\s*\n([\s\S]*)$/i);
  if (!m) return { body: content, keyPoints: [] };
  const keyPoints = m[1].split('\n').map((l) => l.replace(/^\s*[-*]\s+/, '').trim()).filter(Boolean);
  return { body: content.slice(0, m.index), keyPoints };
};

const plainText = (md) => md.replace(/[#*`>-]/g, ' ').replace(/\s+/g, ' ').trim();

export const LessonView = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { language, audioNarrator, setAudioNarrator, applyReward, refreshPending, showToast, online, t } = useApp();

  const { data: lesson, error, loading, reload, mutate } = useApi(() => catalogApi.lesson(lessonId), [lessonId]);
  const chapterId = lesson?.chapter.id;
  const { data: chapter, mutate: mutateChapter } = useApi(
    () => (chapterId ? catalogApi.chapter(chapterId) : Promise.resolve(null)), [chapterId]);

  const [activeTab, setActiveTabTab] = useState('notes'); // 'notes', 'detailedNotes', or 'formulas'
  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!chapterId) return;
    let active = true;
    catalogApi.isDownloaded(chapterId).then((v) => { if (active) setDownloaded(v); });
    return () => { active = false; };
  }, [chapterId]);

  // Stop narration when leaving the lesson.
  useEffect(() => () => window.speechSynthesis?.cancel(), [lessonId]);

  if (loading && !lesson) return <LoadingState rows={2} />;
  if (error && !lesson) return <ErrorState error={error} onRetry={reload} />;

  const { body, keyPoints } = splitKeyPoints(lesson.content);
  const lessons = chapter?.lessons ?? [];
  const quiz = chapter?.quiz;
  const result = outcome?.lessonId === lesson.id ? outcome : null;

  const toggleDownload = async () => {
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

  const toggleNarration = () => {
    const synth = window.speechSynthesis;
    if (!synth) { showToast('Read-aloud is not supported on this device.', 'warn'); return; }
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(`${lesson.title}. ${lesson.summary ?? ''}. ${plainText(body)}`);
    utterance.lang = SPEECH_LANG[language] ?? 'en-IN';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utterance);
    setSpeaking(true);
    setAudioNarrator(true);
  };

  const markComplete = async () => {
    setCompleting(true);
    try {
      const res = await learningApi.completeLesson(lesson.id);
      mutate((l) => ({ ...l, completed: true }));
      mutateChapter((c) => c && { ...c, lessons: c.lessons.map((l) => (l.id === lesson.id ? { ...l, completed: true } : l)) });
      setOutcome({ lessonId: lesson.id, ...res });
      if (res.queued) {
        refreshPending();
        showToast(t('offline.savedForSync'), 'offline');
      } else if (res.reward) {
        applyReward(res.reward);
        showToast(res.reward.leveledUp ? `🎉 Level Up! You reached Level ${res.reward.level.level}!` : `⚡ +${res.reward.xpEarned} XP Earned! Keep going!`,
          res.reward.leveledUp ? 'level' : 'xp');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">

      {/* Back Navigation Bar & Offline Download Button */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(`/student/chapters/${lesson.chapter.id}`)}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {lesson.chapter.title}</span>
        </button>

        {/* Offline Download Button (whole chapter: lessons + quiz) */}
        <button
          onClick={toggleDownload}
          disabled={busy || (!downloaded && !online)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border disabled:opacity-60 ${
            downloaded
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
          }`}
          title={downloaded ? 'Click to remove the offline copy' : 'Save this chapter for offline study'}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4 text-emerald-500" />}
          <span>{downloaded ? t('downloaded') : t('downloadOffline')}</span>
        </button>
      </div>

      {/* Main Content & Video Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left 2 Cols: Video Player & Multilingual Notes Tabs */}
        <div className="lg:col-span-2 space-y-6">

          {/* Lesson Header Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2.5 py-1 bg-blue-600 rounded-lg text-xs font-extrabold uppercase tracking-wider shrink-0">
                {lesson.subject.name}
              </span>
              <span className="text-sm font-bold text-slate-200">{lesson.title}</span>
              {lesson.__offline && <CloudOff className="w-4 h-4 text-amber-300 shrink-0" aria-label="Offline copy" />}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleNarration}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  speaking
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Read this lesson aloud"
              >
                {speaking || audioNarrator ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{speaking ? 'Stop Voice' : 'Regional Voice'}</span>
              </button>
            </div>
          </div>

          {/* Subject Video Player (only when the lesson has a video) */}
          {lesson.videoUrl && online && (
            <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center group">
              <iframe
                key={lesson.id}
                src={lesson.videoUrl}
                title={lesson.title}
                className="w-full h-full rounded-3xl border-0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* Lesson Notes & Concept Tabs */}
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
              <button
                onClick={() => setActiveTabTab('notes')}
                className={`flex items-center gap-2 pb-2 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'notes'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t('viewNotes')}</span>
              </button>

              <button
                onClick={() => setActiveTabTab('detailedNotes')}
                className={`flex items-center gap-2 pb-2 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'detailedNotes'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookMarked className="w-4 h-4" />
                <span>Detailed Notes</span>
              </button>

              <button
                onClick={() => setActiveTabTab('formulas')}
                className={`flex items-center gap-2 pb-2 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'formulas'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Key Concepts & Formulas</span>
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'notes' && (
              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {lesson.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed">{lesson.summary}</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2">
                  <h4 className="font-bold text-blue-900 dark:text-blue-200 text-xs tracking-wider uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>In this lesson ({lesson.durationMinutes} min):</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    Read the Detailed Notes, review the Key Concepts, then mark the lesson complete to earn XP.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Step-by-Step Detailed Notes */}
            {activeTab === 'detailedNotes' && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Step-by-Step Concept Breakdown:
                </h4>
                <Markdown source={body} />
              </div>
            )}

            {/* Tab 3: Key Concepts */}
            {activeTab === 'formulas' && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider pt-2">
                  Key Takeaway Principles:
                </h4>
                {keyPoints.length === 0 ? (
                  <p className="text-xs text-slate-500">{lesson.summary}</p>
                ) : (
                  <ul className="space-y-2">
                    {keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{point.replace(/\*\*|`/g, '')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

          </div>

          {/* Lesson completion */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {lesson.completed ? (
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
                <span>Lesson completed{result?.queued ? ' — saved offline, will sync when you reconnect' : ''}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">Finished reading? Mark this lesson complete to earn XP and advance your streak.</p>
            )}
            {!lesson.completed && (
              <button
                onClick={markComplete}
                disabled={completing}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Mark Lesson Complete (+20 XP)</span>
              </button>
            )}
          </div>

          {result?.reward && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-3xl p-5 border border-amber-200 dark:border-amber-800/50 space-y-2 text-sm animate-pop">
              <p className="font-black text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Zap className="w-4 h-4 fill-amber-400" /> +{result.reward.xpEarned} XP · Level {result.reward.level.level} · 🔥 {result.reward.streak} day streak
              </p>
              {result.reward.newBadges.map((b) => (
                <p key={b.code} className="text-xs font-semibold text-slate-700 dark:text-slate-200">🏆 New badge unlocked: {b.name}</p>
              ))}
              {result.reward.completedMissions.map((m) => (
                <p key={m.code} className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">✅ Mission complete: {t(`missions.${m.code}.title`)} (+{m.xpReward} XP)</p>
              ))}
            </div>
          )}

        </div>

        {/* Right 1 Col: Quiz Callout & Next Lesson Nav */}
        <div className="space-y-6">

          {/* Gamified Quiz Card */}
          {quiz && (
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl space-y-4">
              <div className="inline-flex p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
                <Zap className="w-6 h-6 fill-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Interactive Practice
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Test Your Knowledge
                </h3>
                <p className="text-xs text-amber-100 mt-1">
                  {quiz.bestPercentage != null
                    ? `Your best score is ${quiz.bestPercentage}%. Beat it to earn more XP!`
                    : `Solve ${quiz.questionCount} multiple-choice questions to earn up to ${quiz.questionCount * 10 + 20} XP and advance your daily streak!`}
                </p>
              </div>

              <button
                onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                className="w-full py-3 bg-white hover:bg-amber-50 text-slate-900 font-extrabold text-sm rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t('takeQuiz')}</span>
              </button>
            </div>
          )}

          {/* Chapter Lessons Checklist */}
          <div className="glass-card rounded-3xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Chapter Contents</span>
            </h4>

            <div className="space-y-2">
              {lessons.map((l, idx) => {
                const isSelected = l.id === lesson.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => navigate(`/student/lessons/${l.id}`)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                        isSelected ? 'bg-white text-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="line-clamp-1">{l.title}</span>
                    </div>
                    {l.completed && <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />}
                  </button>
                );
              })}
            </div>

            {/* Next Lesson Navigation */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-xs font-bold">
              {lesson.prevLessonId ? (
                <button
                  onClick={() => navigate(`/student/lessons/${lesson.prevLessonId}`)}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
              ) : <div />}

              {lesson.nextLessonId ? (
                <button
                  onClick={() => navigate(`/student/lessons/${lesson.nextLessonId}`)}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>{t('nextLesson')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : quiz && (
                <button
                  onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>{t('takeQuiz')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
