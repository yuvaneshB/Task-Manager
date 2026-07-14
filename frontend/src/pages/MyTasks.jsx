import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyTasks = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsTask, setDetailsTask] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchMyTasks = async () => {
    try {
      const res = await api.get('/tasks'); // Backend automatically restricts to req.user._id if Employee role
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      toast.error('Failed to load your tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  // Socket setup
  useEffect(() => {
    if (socket) {
      socket.on('task-updated', () => {
        fetchMyTasks();
      });
      socket.on('new-comment', ({ taskId, comment }) => {
        setDetailsTask(prev => {
          if (prev && prev._id === taskId) {
            return {
              ...prev,
              comments: [...prev.comments, comment]
            };
          }
          return prev;
        });
      });
    }
    return () => {
      if (socket) {
        socket.off('task-updated');
        socket.off('new-comment');
      }
    };
  }, [socket]);

  useEffect(() => {
    if (socket && detailsTask) {
      socket.emit('join-task', detailsTask._id);
      return () => {
        socket.emit('leave-task', detailsTask._id);
      };
    }
  }, [socket, detailsTask]);

  // Handle status update
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Task marked as ${newStatus}`);
        fetchMyTasks();
        // If current details matches, update detail view too
        if (detailsTask?._id === taskId) {
          setDetailsTask(res.data.task);
        }
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/tasks/${detailsTask._id}/comments`, { text: newComment });
      if (res.data.success) {
        setNewComment('');
      }
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    setUploading(true);

    try {
      const res = await api.post(`/tasks/${detailsTask._id}/attachments`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('File uploaded successfully');
        setDetailsTask(prev => ({ ...prev, attachments: res.data.attachments }));
        fetchMyTasks();
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Compute local productivity details
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const pendingCount = totalCount - completedCount;
  const overdueCount = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()).length;

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* KPI stats for employee */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 border rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Tasks</span>
            <p className="text-xl font-bold mt-1">{totalCount}</p>
          </div>
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-lg">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 border rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</span>
            <p className="text-xl font-bold mt-1 text-emerald-600">{completedCount}</p>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 border rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">In Progress / Pending</span>
            <p className="text-xl font-bold mt-1 text-blue-600">{pendingCount}</p>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 border rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overdue Tasks</span>
            <p className="text-xl font-bold mt-1 text-rose-600">{overdueCount}</p>
          </div>
          <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-lg">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task Cards List */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">Your Work Checklist</h3>
          
          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border text-slate-400">
              No tasks currently assigned to you. Enjoy your day!
            </div>
          ) : (
            tasks.map((task) => {
              const priorityColors = {
                Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                Medium: 'bg-indigo-50 text-indigo-750',
                High: 'bg-amber-50 text-amber-700',
                Critical: 'bg-rose-50 text-rose-700'
              };

              return (
                <div
                  key={task._id}
                  onClick={() => setDetailsTask(task)}
                  className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-md ${detailsTask?._id === task._id ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-200/60 dark:border-slate-800/60'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${priorityColors[task.priority]}`}>
                      {task.priority} Priority
                    </span>
                    <select
                      value={task.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <h4 className="font-semibold text-sm mt-3 text-slate-850 dark:text-slate-100">{task.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> {task.comments?.length || 0} comments
                    </span>
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" /> {task.attachments?.length || 0} attachments
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Task Detail Pane */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-sm h-fit">
          {detailsTask ? (
            <div className="space-y-4">
              <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base">{detailsTask.title}</h3>
                <p className="text-[10px] text-slate-400 mt-1">Assigned by {detailsTask.createdBy?.name || 'Manager'}</p>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Description</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-1">{detailsTask.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Due Date</span>
                    <strong className="text-slate-800 dark:text-slate-200">{new Date(detailsTask.dueDate).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Status</span>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold rounded-md">
                      {detailsTask.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Attachments</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {detailsTask.attachments?.map((at, idx) => (
                    <a
                      key={idx}
                      href={at.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl hover:bg-slate-100 border text-xs"
                    >
                      <FileText className="h-4 w-4 text-primary-500" />
                      <span className="truncate flex-1 font-medium">{at.name}</span>
                    </a>
                  ))}
                  {(!detailsTask.attachments || detailsTask.attachments.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No attachments uploaded yet</p>
                  )}
                </div>

                <div className="mt-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                    <Plus className="h-3.5 w-3.5" />
                    Upload File
                    <input type="file" onChange={uploadFile} className="hidden" />
                  </label>
                  {uploading && <span className="text-[10px] text-slate-400 ml-2">Uploading...</span>}
                </div>
              </div>

              {/* Comments */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Comments</span>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {detailsTask.comments?.map((c, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border">
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={c.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.user?.name}`}
                          alt="Avatar"
                          className="h-4.5 w-4.5 rounded-full object-cover"
                        />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{c.user?.name}</span>
                        <span className="text-[9px] text-slate-400 ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 pl-1">{c.text}</p>
                    </div>
                  ))}
                  {(!detailsTask.comments || detailsTask.comments.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No comments yet</p>
                  )}
                </div>

                <form onSubmit={submitComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Reply comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Reply
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select one of your assigned tasks to show comments, uploads, and files.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MyTasks;
