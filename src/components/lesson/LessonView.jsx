import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeLesson } from '../../data/lessonTranslations';
import { 
  Play, 
  Pause, 
  DownloadCloud, 
  CheckCircle2, 
  Zap, 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Volume2, 
  VolumeX, 
  Share2, 
  Sparkles,
  BookOpen,
  HelpCircle,
  Globe,
  BookMarked
} from 'lucide-react';

import { QUIZ_BANK } from '../../data/quizBank';

export const LessonView = () => {
  const { 
    courses,
    selectedCourse: rawSelectedCourse, 
    selectedLesson: rawSelectedLesson, 
    setSelectedLesson, 
    openCourse, 
    setActiveTab, 
    startQuiz, 
    toggleLessonDownload,
    audioNarrator,
    setAudioNarrator,
    language,
    setLanguage,
    t 
  } = useApp();

  const [activeTab, setActiveTabTab] = useState('notes'); // 'notes', 'detailedNotes', or 'formulas'
  const [isPlaying, setIsPlaying] = useState(false);
  const [useFallbackVideo, setUseFallbackVideo] = useState(false);

  // Automatic Fallbacks if direct routing or state unassigned
  const selectedCourse = rawSelectedCourse || (courses && courses[0]);
  const selectedLesson = rawSelectedLesson || (selectedCourse?.lessons && selectedCourse.lessons[0]);

  const handleVideoToggle = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleStartQuiz = () => {
    const subj = (selectedCourse?.subject || '').toLowerCase();
    const matchedQuiz = QUIZ_BANK.find(q => 
      (q.subjectId || '').toLowerCase().includes(subj) || 
      (q.title || '').toLowerCase().includes(subj)
    ) || QUIZ_BANK[0];
    startQuiz(matchedQuiz);
  };

  if (!selectedLesson || !selectedCourse) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">No lesson selected.</p>
        <button onClick={() => setActiveTab('courses')} className="mt-4 text-blue-600 font-bold">
          Go to Courses
        </button>
      </div>
    );
  }

  // Localized Content Retrieval based on current selected language
  const localizedTitle = localizeLesson(selectedLesson, language, 'title') || selectedLesson.title;
  const localizedSummary = localizeLesson(selectedLesson, language, 'summary') || selectedLesson.summary;
  const localizedRuralExample = localizeLesson(selectedLesson, language, 'ruralExample');
  const localizedNotes = localizeLesson(selectedLesson, language, 'detailedNotes');
  const localizedFormulas = localizeLesson(selectedLesson, language, 'formulas');
  const localizedKeyPoints = localizeLesson(selectedLesson, language, 'keyPoints') || selectedLesson.keyPoints;

  const currentLessonIndex = selectedCourse.lessons ? selectedCourse.lessons.findIndex(l => l.id === selectedLesson.id) : 0;
  const prevLesson = (selectedCourse.lessons && currentLessonIndex > 0) ? selectedCourse.lessons[currentLessonIndex - 1] : null;
  const nextLesson = (selectedCourse.lessons && currentLessonIndex < selectedCourse.lessons.length - 1) ? selectedCourse.lessons[currentLessonIndex + 1] : null;

  const rawVideoUrl = selectedLesson.videoUrl || 'https://www.youtube.com/embed/bAerID24QJ0';
  const isYouTube = (rawVideoUrl.includes('youtube.com') || rawVideoUrl.includes('youtu.be')) && !useFallbackVideo;

  const languages = [
    { id: 'en', label: 'English' },
    { id: 'hi', label: 'हिंदी' },
    { id: 'or', label: 'ଓଡ଼ିଆ' },
    { id: 'te', label: 'తెలుగు' },
  ];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Back Navigation Bar & Offline Download Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => openCourse(selectedCourse)}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {selectedCourse.title}</span>
        </button>

        {/* Offline Download Button */}
        <button
          onClick={() => toggleLessonDownload(selectedCourse.id, selectedLesson.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            selectedLesson.isDownloaded
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
          }`}
        >
          <DownloadCloud className="w-4 h-4 text-emerald-500" />
          <span>{selectedLesson.isDownloaded ? t('downloaded') : t('downloadOffline')}</span>
        </button>
      </div>

      {/* Main Content & Video Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Video Player & Multilingual Notes Tabs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Lesson Header Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-blue-600 rounded-lg text-xs font-extrabold uppercase tracking-wider">
                {selectedCourse.subject}
              </span>
              <span className="text-sm font-bold text-slate-200">{localizedTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseFallbackVideo(!useFallbackVideo)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  useFallbackVideo
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Switch between YouTube concept video and compressed offline clip"
              >
                {useFallbackVideo ? '📹 Compressed Offline Clip' : '📺 HD Concept Video'}
              </button>
            </div>
          </div>

          {/* Real Subject Video Player */}
          <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center group">
            {isYouTube ? (
              <iframe
                key={selectedLesson.id}
                src={rawVideoUrl}
                title={localizedTitle}
                className="w-full h-full rounded-3xl border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <>
                <video
                  key={selectedLesson.id + (useFallbackVideo ? '-fb' : '')}
                  src={useFallbackVideo && selectedLesson.fallbackVideoUrl ? selectedLesson.fallbackVideoUrl : rawVideoUrl}
                  controls
                  autoPlay={isPlaying}
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover bg-slate-950"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {!isPlaying && (
                  <button
                    onClick={handleVideoToggle}
                    className="absolute z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-400 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                  >
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </button>
                )}
              </>
            )}

            {!isYouTube && (
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-md px-4 py-2 flex items-center justify-between text-white text-xs z-20">
                <div className="flex items-center gap-3">
                  <button onClick={handleVideoToggle} className="hover:text-blue-400">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <span>{selectedCourse.subject} Video • {selectedCourse.grade}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setAudioNarrator(!audioNarrator)} 
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                      audioNarrator ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {audioNarrator ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>Regional Voice</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Multilingual Lesson Notes & Concept Tabs */}
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

            {/* Tab 1: Overview & Rural Example */}
            {activeTab === 'notes' && (
              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {localizedTitle}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed">{localizedSummary}</p>
                </div>

                {localizedRuralExample && (
                  <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2">
                    <h4 className="font-bold text-blue-900 dark:text-blue-200 text-xs tracking-wider uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Real Life Rural Example:</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                      {localizedRuralExample}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Step-by-Step Detailed Notes */}
            {activeTab === 'detailedNotes' && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Step-by-Step Concept Breakdown ({language.toUpperCase()}):
                </h4>

                {Array.isArray(localizedNotes) && localizedNotes.length > 0 ? (
                  <div className="space-y-3">
                    {localizedNotes.map((noteItem, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        {noteItem}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {localizedSummary}
                  </p>
                )}
              </div>
            )}

            {/* Tab 3: Key Concepts & Formulas */}
            {activeTab === 'formulas' && (
              <div className="space-y-4">
                {localizedFormulas && (
                  <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-purple-300">
                      Core Formula & Equation
                    </span>
                    <div className="text-base sm:text-lg font-mono font-bold text-amber-300">
                      {localizedFormulas}
                    </div>
                  </div>
                )}

                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider pt-2">
                  Key Takeaway Principles:
                </h4>
                <ul className="space-y-2">
                  {localizedKeyPoints?.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

        </div>

        {/* Right 1 Col: Quiz Callout & Next Lesson Nav */}
        <div className="space-y-6">
          
          {/* Gamified Quiz Card */}
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
                Solve 5 multiple-choice questions to earn 100 XP and advance your daily streak!
              </p>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full py-3 bg-white hover:bg-amber-50 text-slate-900 font-extrabold text-sm rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('takeQuiz')} (+100 XP)</span>
            </button>
          </div>

          {/* Chapter Lessons Checklist */}
          <div className="glass-card rounded-3xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Chapter Contents</span>
            </h4>

            <div className="space-y-2">
              {selectedCourse.lessons.map((lesson, idx) => {
                const isSelected = lesson.id === selectedLesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
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
                      <span className="line-clamp-1">{lesson.title}</span>
                    </div>
                    {lesson.isCompleted && <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />}
                  </button>
                );
              })}
            </div>

            {/* Next Lesson Navigation */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-xs font-bold">
              {prevLesson ? (
                <button
                  onClick={() => setSelectedLesson(prevLesson)}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
              ) : <div />}

              {nextLesson && (
                <button
                  onClick={() => setSelectedLesson(nextLesson)}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>{t('nextLesson')}</span>
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
