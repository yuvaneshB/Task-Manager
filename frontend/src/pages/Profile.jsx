import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { User, ShieldAlert, KeyRound, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit
  } = useForm({
    defaultValues: {
      name: user?.name,
      department: user?.department
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm
  } = useForm();

  // Profile Update
  const onProfileUpdate = async (data) => {
    setProfileLoading(true);
    try {
      const res = await api.put('/users/profile', data);
      if (res.data.success) {
        toast.success(res.data.message);
        setUser(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      toast.error('Failed to update profile details');
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Change
  const onPasswordChange = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      return toast.error('New passwords do not match!');
    }
    setPasswordLoading(true);
    try {
      const res = await api.put('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      if (res.data.success) {
        toast.success(res.data.message);
        resetPasswordForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update login password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Avatar Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('avatar', file);
    setAvatarLoading(true);

    try {
      const res = await api.put('/users/avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setUser(prev => ({ ...prev, avatar: res.data.avatar }));
      }
    } catch (err) {
      toast.error('Failed to upload profile photo');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div>
        <h2 className="text-xl font-bold tracking-tight">Profile & Security Settings</h2>
        <p className="text-xs text-slate-500">Update personal information, change security credentials, and upload avatars</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar Display */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className="relative">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
              alt="Avatar Profile"
              className="h-28 w-28 rounded-full border-4 border-slate-100 dark:border-slate-800 object-cover shadow-sm"
            />
            {avatarLoading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs">
                Saving...
              </div>
            )}
          </div>
          
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-4">{user?.name}</h4>
          <span className="text-[10px] uppercase font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md mt-1">
            {user?.role}
          </span>
          <p className="text-xs text-slate-400 mt-1">{user?.email}</p>

          <label className="mt-6 flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors w-full justify-center">
            <Upload className="h-4 w-4" />
            Upload Avatar
            <input type="file" onChange={handleAvatarChange} className="hidden" accept="image/*" />
          </label>
        </div>

        {/* Right Side: Inputs */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Form 1: Details */}
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 md:p-6 shadow-sm">
            <h3 className="font-bold text-sm flex items-center gap-2 border-b pb-3 mb-4 text-slate-800 dark:text-slate-100">
              <User className="h-4 w-4 text-slate-400" /> Personal Information
            </h3>
            <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  {...registerProfile('name')}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Department</label>
                <select
                  {...registerProfile('department')}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20 focus:outline-none"
                >
                  <option value="General">General</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Design">Design</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={profileLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow"
              >
                <Save className="h-4 w-4" />
                {profileLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Form 2: Security Password Reset */}
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 md:p-6 shadow-sm">
            <h3 className="font-bold text-sm flex items-center gap-2 border-b pb-3 mb-4 text-slate-800 dark:text-slate-100">
              <KeyRound className="h-4 w-4 text-slate-400" /> Update Password
            </h3>
            <form onSubmit={handlePasswordSubmit(onPasswordChange)} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword('currentPassword', { required: true })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword('newPassword', { required: true })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword('confirmPassword', { required: true })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/20 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow"
              >
                <KeyRound className="h-4 w-4" />
                {passwordLoading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
