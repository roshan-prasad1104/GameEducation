import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GRADES } from '../../data/mockData';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Calculator, 
  Atom, 
  FlaskConical, 
  Dna, 
  DownloadCloud,
  ChevronRight
} from 'lucide-react';

export const CourseCatalog = () => {
  const { courses, openCourse, selectedGrade, setSelectedGrade, t } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  const subjects = ['All', 'Math', 'Science', 'Physics', 'Chemistry', 'Biology'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || course.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            NCERT Curriculum Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bite-sized gamified lessons designed for Grade 6 to Grade 12 students.
          </p>
        </div>

        {/* Grade Level Selector */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
          <span className="text-xs font-bold text-slate-500 pl-2">Grade:</span>
          {GRADES.slice(0, 5).map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGrade(g.label)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedGrade === g.label
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50'
              }`}
            >
              {g.label.replace('Grade ', 'G')}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar & Subject Filter Buttons */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g. Linear Equations, Friction, Photosynthesis)..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedSubject === sub
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            onClick={() => openCourse(course)}
            className="glass-card glass-card-hover rounded-3xl p-6 space-y-5 cursor-pointer border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-xl text-white ${course.badgeColor}`}>
                  {course.subject}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-500 font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {course.difficulty}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                    {course.grade}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Progress</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{course.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>{course.totalLessons} Lessons</span>
              </div>
              <button className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:translate-x-1 transition-transform">
                <span>Start Learning</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
