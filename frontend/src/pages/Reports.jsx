import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  CheckSquare, 
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      const res = await api.get('/reports/weekly');
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      toast.error('Failed to retrieve reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // PDF Generation Function
  const exportPDF = () => {
    if (!reportData) return;
    try {
      const doc = new jsPDF();

      // Company Logo / Title
      doc.setFillColor(79, 70, 229); // Brand Indigo
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('Helvetica', 'bold');
      doc.text('ENTERPRISE TASK DYNAMICS', 14, 25);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text('WEEKLY SYSTEM STATUS REPORT', 14, 32);

      // Metas
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 50);
      doc.text(`Active Employees Audited: ${reportData.reports?.length || 0}`, 14, 55);

      // Section 1: Productivity Summary Table
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('1. Team Performance Leaderboard', 14, 70);

      const tableData = reportData.leaderboard.map((entry, index) => [
        `#${index + 1}`,
        entry.user.name,
        entry.user.department,
        entry.metrics.assigned,
        entry.metrics.completed,
        entry.metrics.averageCompletionTimeHours + 'h',
        entry.metrics.productivityScore
      ]);

      doc.autoTable({
        startY: 75,
        head: [['Rank', 'Employee', 'Department', 'Assigned', 'Completed', 'Avg Speed', 'Productivity Score']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });

      // Section 2: Recent Task Audit
      const finalY = doc.previousAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('2. Weekly Task Audit Trail', 14, finalY);

      const auditData = reportData.weeklyTasks.map(task => [
        task.title,
        task.status,
        task.priority,
        new Date(task.dueDate).toLocaleDateString(),
        task.assignedTo?.name || 'Unassigned'
      ]);

      doc.autoTable({
        startY: finalY + 5,
        head: [['Task Title', 'Status', 'Priority', 'Due Date', 'Assignee']],
        body: auditData,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] }
      });

      // Save PDF
      doc.save(`Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report exported successfully!');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  // Excel Generation Function
  const exportExcel = () => {
    if (!reportData) return;
    try {
      // 1. Leaderboard Sheet
      const leaderboardData = reportData.leaderboard.map((entry, index) => ({
        Rank: index + 1,
        Employee: entry.user.name,
        Email: entry.user.email,
        Department: entry.user.department,
        TasksAssigned: entry.metrics.assigned,
        TasksCompleted: entry.metrics.completed,
        AvgCompletionHours: entry.metrics.averageCompletionTimeHours,
        OverdueTasks: entry.metrics.overdue,
        ProductivityScore: entry.metrics.productivityScore
      }));

      // 2. Weekly Tasks Sheet
      const tasksData = reportData.weeklyTasks.map(task => ({
        TaskTitle: task.title,
        Description: task.description || '',
        Status: task.status,
        Priority: task.priority,
        DueDate: new Date(task.dueDate).toLocaleDateString(),
        AssignedEmployee: task.assignedTo?.name || 'Unassigned',
        EmployeeEmail: task.assignedTo?.email || '',
        CompletedDate: task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''
      }));

      // Build WorkBook
      const wb = XLSX.utils.book_new();
      
      const wsLeaderboard = XLSX.utils.json_to_sheet(leaderboardData);
      const wsTasks = XLSX.utils.json_to_sheet(tasksData);

      XLSX.utils.book_append_sheet(wb, wsLeaderboard, "Leaderboard");
      XLSX.utils.book_append_sheet(wb, wsTasks, "Tasks Log");

      XLSX.writeFile(wb, `Weekly_Performance_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel spreadsheet exported successfully!');
    } catch (error) {
      toast.error('Failed to export Excel');
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Summary Metrics calculations
  const totalTasks = reportData.weeklyTasks.length;
  const completedTasks = reportData.weeklyTasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Weekly Performance Audit</h2>
          <p className="text-xs text-slate-500">Generate executive PDF summaries and data Excel downloads</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <FileText className="h-4.5 w-4.5 text-rose-500" />
            Export PDF
          </button>
          
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Quick Snapshot Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weekly Tasks Cataloged</span>
            <p className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">{totalTasks}</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-lg">
            <CheckSquare className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weekly Completions</span>
            <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-450">{completedTasks}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Backlog</span>
            <p className="text-xl font-bold mt-1 text-orange-500">{pendingTasks}</p>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 text-orange-500 rounded-lg">
            <AlertCircle className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Leaderboard Table View inside UI */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-sm">Preview Leaderboard Data</h3>
        </div>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 uppercase tracking-wider font-bold border-b">
                <th className="p-4 w-12">Rank</th>
                <th className="p-4">Employee</th>
                <th className="p-4">Department</th>
                <th className="p-4 text-center">Assigned</th>
                <th className="p-4 text-center">Completed</th>
                <th className="p-4 text-center">Speed</th>
                <th className="p-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-105">
              {reportData.leaderboard.map((entry, idx) => (
                <tr key={entry.user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="p-4 font-semibold">{entry.user.name}</td>
                  <td className="p-4 text-slate-500">{entry.user.department}</td>
                  <td className="p-4 text-center">{entry.metrics.assigned}</td>
                  <td className="p-4 text-center text-emerald-600 font-bold">{entry.metrics.completed}</td>
                  <td className="p-4 text-center font-medium">{entry.metrics.averageCompletionTimeHours} hrs</td>
                  <td className="p-4 text-right font-bold text-indigo-600 dark:text-indigo-400">{entry.metrics.productivityScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
