import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Layers, 
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  // Auto-fill registered email from redirect state
  useEffect(() => {
    if (location.state?.email) {
      setValue('email', location.state.email);
      toast.success('Registration successful! Please sign in.');
    }
  }, [location.state, setValue]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const result = await login(data.email, data.password);
    setSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      
      {/* LEFT PANEL: Clean minimal login form */}
      <div className="flex flex-col justify-between p-6 sm:p-12 md:p-16 lg:p-20 bg-white dark:bg-slate-950">
        
        {/* Mobile Header Logo */}
        <div className="flex items-center gap-2.5 lg:hidden mb-8">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-slate-800 dark:text-slate-200">
            WorkSpace
          </span>
        </div>

        {/* Desktop Top Alignment Header */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <span className="font-semibold text-base text-slate-800 dark:text-slate-200">
              WorkSpace
            </span>
          </div>
        </div>

        {/* Login Form card */}
        <div className="w-full max-w-sm mx-auto my-auto py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-955 dark:text-white tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Enter your credentials to access your task dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register('email', { 
                    required: 'Email is required', 
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } 
                  })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all duration-200 ${
                    errors.email 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-rose-500 text-xs mt-1.5 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all duration-200 ${
                    errors.password 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-rose-500 text-xs mt-1.5 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200 shadow-sm"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        {/* Bottom Navigation links */}
        <div className="text-center pt-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold transition-all"
            >
              Sign up
            </Link>
          </p>
        </div>

      </div>

      {/* RIGHT PANEL: Simple and professional colorful design panel */}
      <div className="hidden lg:flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500">
        {/* Glowing floating blobs inside the panel */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full mix-blend-screen filter blur-2xl animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[25rem] h-[25rem] bg-cyan-400/25 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-[30%] right-[10%] w-64 h-64 bg-indigo-400/20 rounded-full mix-blend-screen filter blur-2xl animate-blob animation-delay-4000"></div>
        
        {/* Minimalist Glass Card inside the panel for depth */}
        <div className="w-72 h-72 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl relative z-10 flex flex-col justify-center items-center p-8 transition-transform duration-500 hover:scale-105">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/30 shadow-lg mb-4 animate-pulse">
            <Layers className="h-8 w-8" />
          </div>
          <h2 className="font-extrabold text-xl text-white tracking-wider text-center">WorkSpace</h2>
          <p className="text-[10px] text-white/70 font-semibold tracking-widest uppercase mt-1">All Tasks. One Platform.</p>
        </div>
      </div>

    </div>
  );
};

export default Login;
