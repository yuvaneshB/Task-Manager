import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email });
      if (res.data.success) {
        toast.success('Verification OTP code sent to your email!');
        navigate(`/otp-verify?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request password reset OTP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Forgot Password</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your email to receive a 6-digit OTP code
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              placeholder="name@company.com"
              {...register('email', { 
                required: 'Email is required', 
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } 
              })}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                errors.email 
                  ? 'border-rose-500 focus:border-rose-500' 
                  : 'border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-rose-500 text-[10px] mt-1">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Sending Code...' : 'Request OTP'}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <div className="text-center mt-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
