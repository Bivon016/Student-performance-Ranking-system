import React, { useState, useEffect } from 'react';
import { User, Phone, Save, Shield, Building2, Loader2 } from 'lucide-react';
import { getCurrentUser, updateProfile, changePassword } from '../services/api';
import { Toast } from '../components/UserMessage';
import { getFriendlyError } from '../utils/errorMessages';

const PROFILE_EXTRAS_KEY = 'userProfileExtras';

function formatRole(role) {
  if (!role) return 'User';
  return role.replace('ROLE_', '').replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function loadExtras(userId) {
  try {
    const all = JSON.parse(localStorage.getItem(PROFILE_EXTRAS_KEY) || '{}');
    return all[userId] || { phone: '', bio: '' };
  } catch {
    return { phone: '', bio: '' };
  }
}

function saveExtras(userId, extras) {
  const all = JSON.parse(localStorage.getItem(PROFILE_EXTRAS_KEY) || '{}');
  all[userId] = extras;
  localStorage.setItem(PROFILE_EXTRAS_KEY, JSON.stringify(all));
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 transition-colors';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCurrentUser();
        const extras = loadExtras(data.id);
        setUser({
          id: data.id,
          name: data.name || data.username,
          username: data.username,
          role: data.role,
          schoolName: data.schoolName || '',
          phone: extras.phone,
          bio: extras.bio,
        });
      } catch {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const extras = loadExtras(stored.id || 'local');
        setUser({
          id: stored.id || 'local',
          name: stored.name || stored.username || 'User',
          username: stored.username || stored.name,
          role: stored.role,
          schoolName: stored.schoolName || '',
          phone: extras.phone,
          bio: extras.bio,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const syncLocalUser = (updated) => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const merged = { ...stored, ...updated };
    localStorage.setItem('user', JSON.stringify(merged));
    window.dispatchEvent(new Event('user-updated'));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const data = await updateProfile({ username: user.name });
      saveExtras(user.id, { phone: user.phone, bio: user.bio });
      const updated = {
        id: data.id,
        name: data.name || data.username,
        username: data.username,
        role: data.role,
        schoolName: user.schoolName,
      };
      syncLocalUser(updated);
      setUser(prev => ({ ...prev, ...updated }));
      setIsEditing(false);
      setToast({ message: 'Profile updated successfully', type: 'success' });
    } catch (err) {
      setToast({ message: getFriendlyError(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setToast({ message: 'Password changed successfully', type: 'success' });
    } catch (err) {
      setToast({ message: getFriendlyError(err), type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="animate-spin mr-3" size={24} />
        Loading profile…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account information and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg shadow-indigo-500/30">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h2>
              <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                {formatRole(user.role)}
              </span>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <User size={18} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Username</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{user.username}</p>
                </div>
              </div>
              {user.schoolName && (
                <div className="flex items-center gap-3">
                  <Building2 size={18} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">School</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{user.schoolName}</p>
                  </div>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Personal Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl font-medium text-sm transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Display Name</label>
                <input
                  type="text"
                  value={user.name}
                  onChange={e => setUser({ ...user, name: e.target.value })}
                  disabled={!isEditing}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <input type="text" value={formatRole(user.role)} disabled className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone Number</label>
                <input
                  type="tel"
                  value={user.phone}
                  onChange={e => setUser({ ...user, phone: e.target.value })}
                  disabled={!isEditing}
                  className={inputCls}
                  placeholder="+254 700 000 000"
                />
              </div>
              <div>
                <label className={labelCls}>School</label>
                <input type="text" value={user.schoolName || '—'} disabled className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Bio</label>
                <textarea
                  value={user.bio}
                  onChange={e => setUser({ ...user, bio: e.target.value })}
                  disabled={!isEditing}
                  rows="3"
                  className={inputCls}
                  placeholder="A short note about yourself…"
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-lg shadow-indigo-500/20"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-indigo-600 dark:text-indigo-400" size={22} />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className={labelCls}>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className={inputCls}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className={inputCls}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {changingPassword ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                  {changingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
