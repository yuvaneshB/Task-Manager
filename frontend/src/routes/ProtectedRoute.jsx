import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg max-w-xl mx-auto my-12">
        <div className="h-20 w-20 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner mb-6">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-slate-100 mb-3">
          Access Denied
        </h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mb-6 max-w-md leading-relaxed">
          You do not have permission to access this resource. Task creation, assignment, and management tools are restricted strictly to users with the **Manager** role.
        </p>
        <div className="flex gap-4">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all duration-200"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
