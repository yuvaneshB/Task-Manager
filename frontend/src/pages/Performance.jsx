import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Trophy, 
  Award, 
  Target, 
  Clock, 
  Zap, 
  TrendingUp, 
  ShieldAlert 
} from 'lucide-react';
import { motion } from 'framer-motion';

const Performance = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformanceData = async () => {
    try {
      const res = await api.get('/reports/weekly'); // Uses the reports data aggregator
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Top 3 Podium
  const podium = leaderboard.slice(0, 3);
  const restOfTeam = leaderboard.slice(3);

  // Styled cards config
  const podiumColors = [
    { border: 'border-yellow-400 dark:border-yellow-500', bg: 'from-amber-50 to-yellow-50 dark:from-yellow-950/20 dark:to-amber-950/20', text: 'text-amber-600 dark:text-amber-400', badge: '🥇 Gold rank' },
    { border: 'border-slate-350 dark:border-slate-500', bg: 'from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-800/40', text: 'text-slate-600 dark:text-slate-400', badge: '🥈 Silver rank' },
    { border: 'border-orange-350 dark:border-orange-500', bg: 'from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/20', text: 'text-orange-600 dark:text-orange-400', badge: '🥉 Bronze rank' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Overview Intro */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Performance Tracking Center</h2>
        <p className="text-xs text-slate-500">Real-time team leaderboard rankings, speed efficiency metrics, and task progress rates</p>
      </div>

      {/* Podium Display (Top 3 Performers) */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {podium.map((entry, idx) => {
            const style = podiumColors[idx] || podiumColors[0];
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={entry.user.id}
                className={`bg-gradient-to-br ${style.bg} border-2 ${style.border} rounded-2xl p-5 shadow-sm text-center relative overflow-hidden flex flex-col items-center justify-between`}
              >
                <div className="absolute top-3 right-3 text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-white/70 dark:bg-slate-900/70 rounded-full">
                  {style.badge}
                </div>

                <div className="flex flex-col items-center mt-4">
                  <img
                    src={entry.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${entry.user.name}`}
                    alt="Podium User"
                    className="h-16 w-16 rounded-full border-4 border-white dark:border-slate-800 shadow-md object-cover"
                  />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-3">{entry.user.name}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{entry.user.department}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 w-full mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">Assigned</span>
                    <strong className="text-slate-800 dark:text-slate-200">{entry.metrics.assigned}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">Completed</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{entry.metrics.completed}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">Score</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">{entry.metrics.productivityScore}</strong>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Team Rankings & Performance Audit</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800/60">
                <th className="p-4 w-12">Rank</th>
                <th className="p-4">Employee</th>
                <th className="p-4">Department</th>
                <th className="p-4 text-center">Tasks Assigned</th>
                <th className="p-4 text-center">Tasks Completed</th>
                <th className="p-4 text-center">Avg Speed (hrs)</th>
                <th className="p-4 text-center">Overdue</th>
                <th className="p-4 text-center">Completion Ratio</th>
                <th className="p-4 text-right">Productivity Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {leaderboard.map((entry, idx) => (
                <tr key={entry.user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={entry.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${entry.user.name}`}
                        alt="Employee Avatar"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{entry.user.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{entry.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 font-medium">
                    {entry.user.department}
                  </td>
                  <td className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                    {entry.metrics.assigned}
                  </td>
                  <td className="p-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                    {entry.metrics.completed}
                  </td>
                  <td className="p-4 text-center text-slate-500 font-semibold">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {entry.metrics.averageCompletionTimeHours}h
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-rose-500">
                    {entry.metrics.overdue}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary-500 h-full rounded-full" 
                          style={{ width: `${entry.metrics.completionPercentage}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {entry.metrics.completionPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
                      <Zap className="h-3 w-3" />
                      {entry.metrics.productivityScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Performance;
