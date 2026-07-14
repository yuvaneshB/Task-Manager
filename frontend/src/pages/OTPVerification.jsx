import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { KeyRound, Lock, ArrowRight, RotateCw, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const OTPVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { email }
  });

  useEffect(() => {
    if (!email) {
      toast.error('Invalid link session, please start over');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        toast.success('A new OTP has been sent!');
        setResendCooldown(60); // 60 seconds cooldown
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email,
        otp: data.otp,
        password: data.password
      });
      if (res.data.success) {
        toast.success('Password reset completed successfully. Please sign in!');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Verify Code</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verify the OTP sent to <strong className="text-primary-600 dark:text-primary-400 font-semibold">{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* OTP Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            6-Digit Verification Code
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <KeyRound className="h-4 w-4" />
            </span>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              {...register('otp', { 
                required: 'OTP code is required', 
                minLength: { value: 6, message: 'OTP must be 6 digits' } 
              })}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm tracking-wider font-semibold border bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                errors.otp 
                  ? 'border-rose-500 focus:border-rose-500' 
                  : 'border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500'
              }`}
            />
          </div>
          {errors.otp && (
            <p className="text-rose-500 text-[10px] mt-1">{errors.otp.message}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', { 
                required: 'New password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                errors.password 
                  ? 'border-rose-500 focus:border-rose-500' 
                  : 'border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500'
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-rose-500 text-[10px] mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Updating Password...' : 'Reset Password'}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <div className="flex justify-between items-center text-xs mt-6">
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 dark:text-slate-400 font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Request New Code
        </Link>

        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className={`inline-flex items-center gap-1.5 font-semibold transition-all ${
            resendCooldown > 0 
              ? 'text-slate-400 cursor-not-allowed' 
              : 'text-primary-600 hover:text-primary-700 dark:text-primary-400'
          }`}
        >
          <RotateCw className={`h-3.5 w-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
          {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;
