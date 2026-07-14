import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  CheckCircle2, 
  MessageSquare, 
  Paperclip, 
  Calendar, 
  User, 
  X,
  FileText,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Selected Tasks for Bulk Action
  const [selectedTasks, setSelectedTasks] = useState([]);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // Task Details side pane/modal
  const [detailsTask, setDetailsTask] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks', {
        params: {
          search,
          status: statusFilter,
          priority: priorityFilter,
          assignedTo: assigneeFilter,
          sortBy,
          order: sortOrder,
          page,
          limit: 8
        }
      });
      if (res.data.success) {
        setTasks(res.data.tasks);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      toast.error('Failed to fetch tasks');
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await api.get('/users/team');
      if (res.data.success) {
        setTeamMembers(res.data.members);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, statusFilter, priorityFilter, assigneeFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Socket updates connection
  useEffect(() => {
    if (socket) {
      socket.on('task-updated', () => {
        fetchTasks();
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

  // Connect to comment rooms
  useEffect(() => {
    if (socket && detailsTask) {
      socket.emit('join-task', detailsTask._id);
      return () => {
        socket.emit('leave-task', detailsTask._id);
      };
    }
  }, [socket, detailsTask]);

  // Handle CRUD
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);
    
    try {
      const res = await api.post('/tasks', payload);
      if (res.data.success) {
        toast.success('Task created successfully!');
        setCreateModalOpen(false);
        fetchTasks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    try {
      const res = await api.put(`/tasks/${activeTask._id}`, payload);
      if (res.data.success) {
        toast.success('Task updated successfully!');
        setEditModalOpen(false);
        setActiveTask(null);
        fetchTasks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await api.delete(`/tasks/${id}`);
      if (res.data.success) {
        toast.success('Task deleted successfully');
        if (detailsTask?._id === id) setDetailsTask(null);
        fetchTasks();
      }
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  // Comments and Attachments
  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/tasks/${detailsTask._id}/comments`, { text: newComment });
      if (res.data.success) {
        setNewComment('');
        // Socket broadcast handles adding comment to UI state
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
        fetchTasks();
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Bulk Actions
  const toggleSelectTask = (id) => {
    setSelectedTasks(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = async (status) => {
    try {
      const res = await api.post('/tasks/bulk-status', { taskIds: selectedTasks, status });
      if (res.data.success) {
        toast.success(`Bulk updated status to ${status}`);
        setSelectedTasks([]);
        fetchTasks();
      }
    } catch (err) {
      toast.error('Bulk update failed');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedTasks.length} tasks?`)) return;
    try {
      const res = await api.post('/tasks/bulk-delete', { taskIds: selectedTasks });
      if (res.data.success) {
        toast.success('Bulk deleted tasks');
        setSelectedTasks([]);
        fetchTasks();
      }
    } catch (err) {
      toast.error('Bulk delete failed');
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Header and Add Task */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Task Board</h2>
          <p className="text-xs text-slate-500">Coordinate projects, assign teammates, and audit activity logs</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Task
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          {/* Assignee */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
          >
            <option value="">All Assignees</option>
            {teamMembers.map(member => (
              <option key={member._id} value={member._id}>{member.name}</option>
            ))}
          </select>

          {/* Sort By */}
          <button
            onClick={() => {
              setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
            }}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </button>
        </div>
      </div>

      {/* Main Tasks Table / Board List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task Cards List Panel */}
        <div className="lg:col-span-2 space-y-3">
          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center border rounded-2xl text-slate-400">
              No tasks match your search criteria.
            </div>
          ) : (
            tasks.map((task) => {
              const priorityColors = {
                Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                Medium: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400',
                High: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
                Critical: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
              };

              const statusColors = {
                Pending: 'bg-slate-100 text-slate-700 dark:bg-slate-850',
                'In Progress': 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
                Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
              };

              return (
                <div
                  key={task._id}
                  onClick={() => setDetailsTask(task)}
                  className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-md flex items-center gap-4 ${detailsTask?._id === task._id ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-200/60 dark:border-slate-800/60'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task._id)}
                    onChange={() => toggleSelectTask(task._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4.5 w-4.5 rounded text-primary-600 focus:ring-primary-500 border-slate-350 dark:border-slate-750"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusColors[task.status]}`}>
                        {task.status}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-auto">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold mt-2 text-slate-800 dark:text-slate-100 truncate">{task.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                    
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <img
                            src={task.assignedTo.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.name}`}
                            alt="Assignee"
                            className="h-5 w-5 rounded-full object-cover"
                          />
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80px]">
                            {task.assignedTo.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <User className="h-3.5 w-3.5" /> Unassigned
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {task.comments?.length || 0} comments
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" />
                        {task.attachments?.length || 0} files
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-between items-center py-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs border rounded-xl disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">Page {page} of {pages}</span>
              <button
                disabled={page === pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                className="px-3 py-1.5 text-xs border rounded-xl disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Task Details / Interactions Side Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 h-fit">
          {detailsTask ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b pb-3 border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{detailsTask.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Created by {detailsTask.createdBy?.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActiveTask(detailsTask);
                      setEditModalOpen(true);
                    }}
                    className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(detailsTask._id)}
                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-500 leading-relaxed dark:text-slate-400">{detailsTask.description}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="text-[10px] block text-slate-400">Due Date</span>
                    <strong className="text-slate-800 dark:text-slate-200">{new Date(detailsTask.dueDate).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] block text-slate-400">Assigned To</span>
                    <strong className="text-slate-800 dark:text-slate-200">{detailsTask.assignedTo?.name || 'Unassigned'}</strong>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
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

              {/* Comments Section */}
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
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a task from the list to display attachments, conversations, and audits.
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Button Bar */}
      {selectedTasks.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3.5 rounded-2xl shadow-xl z-30 flex items-center gap-4 transition-all duration-300">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {selectedTasks.length} tasks selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatus('Completed')}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow"
            >
              <CheckCircle2 className="h-4 w-4" /> Bulk Complete
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow"
            >
              <Trash2 className="h-4 w-4" /> Bulk Delete
            </button>
            <button
              onClick={() => setSelectedTasks([])}
              className="text-slate-400 hover:text-slate-600 text-xs px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-bold text-md">New Task Creation</h3>
              <button onClick={() => setCreateModalOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Task Title</label>
                <input name="title" required type="text" className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-primary-500 bg-slate-50 dark:bg-slate-950/20" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-primary-500 bg-slate-50 dark:bg-slate-950/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Priority</label>
                  <select name="priority" className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-950/20">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Due Date</label>
                  <input name="dueDate" required type="date" className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-950/20" />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Assign User</label>
                <select name="assignedTo" className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-950/20">
                  <option value="">Unassigned</option>
                  {teamMembers.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md">
                Launch Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && activeTask && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-bold text-md">Edit Task Details</h3>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Task Title</label>
                <input name="title" defaultValue={activeTask.title} required type="text" className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea name="description" defaultValue={activeTask.description} rows={3} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Priority</label>
                  <select name="priority" defaultValue={activeTask.priority} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select name="status" defaultValue={activeTask.status} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Due Date</label>
                  <input name="dueDate" defaultValue={activeTask.dueDate ? new Date(activeTask.dueDate).toISOString().split('T')[0] : ''} required type="date" className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Assign User</label>
                  <select name="assignedTo" defaultValue={activeTask.assignedTo?._id || ''} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20">
                    <option value="">Unassigned</option>
                    {teamMembers.map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;
