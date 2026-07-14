import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BarChart3, 
  FileSpreadsheet, 
  Bell, 
  User as UserIcon,  
  Settings as SettingsIcon, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X,
  Layers,
  ChevronDown
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Sync Sockets for Notifications
  useEffect(() => {
    if (socket) {
      socket.on('new-notification', () => {
        fetchNotifications();
      });
    }
    return () => {
      if (socket) socket.off('new-notification');
    };
  }, [socket]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => {
        const target = notifications.find(n => n._id === id);
        return target && !target.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Task Board', path: '/tasks', icon: CheckSquare, roles: ['Manager'] },
    { name: 'My Tasks', path: '/my-tasks', icon: CheckSquare, roles: ['Employee'] },
    { name: 'Team performance', path: '/performance', icon: BarChart3, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Weekly Reports', path: '/reports', icon: FileSpreadsheet, roles: ['Admin', 'Manager'] },
    { name: 'Admin Control', path: '/admin', icon: ShieldAlert, roles: ['Admin'] },
    { name: 'Profile Settings', path: '/profile', icon: UserIcon, roles: ['Admin', 'Manager', 'Employee'] },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

  const pageTitle = menuItems.find(item => item.path === location.pathname)?.name || 'Task Management';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 z-20 transition-colors duration-300">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <Layers className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-500 dark:from-primary-400 dark:to-indigo-300">
            All Tasks
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shadow-sm border-l-4 border-primary-600' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
                `}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Quick Profile Info Footer */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
            alt="User Avatar"
            className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate dark:text-slate-200">{user?.name}</p>
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100 dark:border-indigo-950 mt-0.5">
              {user?.role}
            </span>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 z-40 lg:hidden flex flex-col border-r border-slate-200 dark:border-slate-800"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white">
                    <Layers className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-md">All Tasks</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1">
                {allowedMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                        ${isActive 
                          ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:pl-64">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 transition-colors duration-300">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 hidden sm:block">
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-3">


            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-800 relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {notifDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotifDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="font-bold text-sm">Notifications Center</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-sm text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => {
                                markSingleRead(n._id);
                                if (n.relatedTask) navigate(`/tasks`);
                                setNotifDropdownOpen(false);
                              }}
                              className={`p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors duration-150 flex gap-3 ${!n.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}
                            >
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                                <span className="text-[10px] text-slate-400 mt-2 block">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <button
                                onClick={(e) => deleteNotif(e, n._id)}
                                className="text-slate-400 hover:text-rose-500 self-start p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800"
              >
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                  alt="Avatar"
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <p className="font-bold text-sm truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                        >
                          <UserIcon className="h-4 w-4 text-slate-400" />
                          My Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate('/profile'); // Points to settings tab
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                        >
                          <SettingsIcon className="h-4 w-4 text-slate-400" />
                          Settings
                        </button>
                        <hr className="border-slate-200 dark:border-slate-800 my-1" />
                        <button
                          onClick={() => {
                            logout();
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Log Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/60 dark:bg-slate-950/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
