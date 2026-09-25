import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TEACHER_ANALYTICS } from '../../data/mockData';
import { 
  Users, 
  UserCheck, 
  Award, 
  AlertTriangle, 
  Plus, 
  FileCheck, 
  Search, 
  BookOpen, 
  TrendingUp, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const TeacherDashboard = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTabTab] = useState('roster'); // 'roster', 'weakTopics', 'assignments'
  const [searchQuery, setSearchQuery] = useState('');

  const [assignments, setAssignments] = useState(TEACHER_ANALYTICS.assignments);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');

  const filteredStudents = TEACHER_ANALYTICS.studentRoster.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.weakArea.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    if (!newAssignmentTitle) return;
    const newAss = {
      id: `a${Date.now()}`,
      title: newAssignmentTitle,
      subject: "Math & Science",
      dueDate: "In 3 Days",
      submittedCount: 0,
      totalCount: TEACHER_ANALYTICS.totalStudents,
      status: "Active"
    };
    setAssignments([newAss, ...assignments]);
    setNewAssignmentTitle('');
    showToast('📢 Assignment broadcasted to all students!', 'success');
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            Panchayat & Rural School Educator Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Teacher & Mentor Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {TEACHER_ANALYTICS.schoolName}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
          <div className="text-center px-2">
            <div className="text-xl font-extrabold text-emerald-400">{TEACHER_ANALYTICS.totalStudents}</div>
            <div className="text-[10px] font-semibold text-slate-300">Enrolled Students</div>
          </div>
          <div className="h-6 w-[1px] bg-white/20" />
          <div className="text-center px-2">
            <div className="text-xl font-extrabold text-blue-400">{TEACHER_ANALYTICS.averageAttendance}%</div>
            <div className="text-[10px] font-semibold text-slate-300">Avg Attendance</div>
          </div>
          <div className="h-6 w-[1px] bg-white/20" />
          <div className="text-center px-2">
            <div className="text-xl font-extrabold text-amber-400">{TEACHER_ANALYTICS.averageQuizScore}%</div>
            <div className="text-[10px] font-semibold text-slate-300">Avg Quiz Score</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTabTab('roster')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'roster'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Roster & Performance</span>
        </button>

        <button
          onClick={() => setActiveTabTab('weakTopics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'weakTopics'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Weak Topic Heatmap ({TEACHER_ANALYTICS.weakTopics.length})</span>
        </button>

        <button
          onClick={() => setActiveTabTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'assignments'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-500" />
          <span>Assignment Manager</span>
        </button>
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
              placeholder="Search student by name or weak area..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Student Roster Table */}
          <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 font-bold text-xs text-slate-500 dark:text-slate-400 grid grid-cols-12 gap-2 uppercase tracking-wider">
              <span className="col-span-4">Student Name</span>
              <span className="col-span-2 text-center">Attendance</span>
              <span className="col-span-2 text-center">Avg Quiz Score</span>
              <span className="col-span-2 text-center">Status</span>
              <span className="col-span-2 text-right pr-4">Weak Area</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((st) => (
                <div key={st.id} className="grid grid-cols-12 gap-2 items-center p-4 text-xs font-semibold hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="col-span-4 font-bold text-slate-900 dark:text-white text-sm">
                    {st.name} <span className="text-[11px] font-normal text-slate-400">({st.grade})</span>
                  </div>
                  <span className="col-span-2 text-center text-emerald-600 font-bold">{st.attendance}</span>
                  <span className="col-span-2 text-center text-blue-600 font-bold">{st.avgScore}</span>
                  <div className="col-span-2 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      st.status === 'Top Performer' ? 'bg-emerald-100 text-emerald-700' :
                      st.status === 'Needs Attention' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {st.status}
                    </span>
                  </div>
                  <span className="col-span-2 text-right pr-4 text-amber-600 dark:text-amber-400 font-medium">{st.weakArea}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'weakTopics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEACHER_ANALYTICS.weakTopics.map((wt, idx) => (
            <div key={idx} className="glass-card p-6 rounded-3xl space-y-4 border border-amber-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
                  {wt.subject}
                </span>
                <span className="text-xs font-bold text-rose-500">
                  {wt.errorRate}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {wt.topic}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Recommended Action:</strong> {wt.recommendation}
                </p>
              </div>

              <button
                onClick={() => showToast(`📢 Practice quiz assigned for ${wt.topic}!`, 'success')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Assign Remedial Practice</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          
          {/* Create Assignment Form */}
          <form onSubmit={handleCreateAssignment} className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Broadcast New Assignment to Students</span>
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newAssignmentTitle}
                onChange={(e) => setNewAssignmentTitle(e.target.value)}
                placeholder="Enter assignment title (e.g. Pythagoras Theorem Chapter 3 Quiz)..."
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold text-xs rounded-xl shadow"
              >
                Broadcast
              </button>
            </div>
          </form>

          {/* Active Assignments List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {assignments.map((ass) => (
              <div key={ass.id} className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                    {ass.subject}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {ass.dueDate}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {ass.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Submitted by {ass.submittedCount} of {ass.totalCount} students
                  </p>
                </div>

                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.round((ass.submittedCount / ass.totalCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
