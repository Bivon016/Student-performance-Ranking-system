import React, { useState, useEffect, useRef } from 'react';
import {
  Save, Globe, Building, Bell, Shield, Palette,
  Database, Download, School, Upload, X, CheckCircle, AlertCircle
} from 'lucide-react';
import { useSchool } from '../hooks/useSchool';
import { getRole } from '../services/api';
import { API_BASE } from '../config';

const BASE = API_BASE;

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ─── School Profile Tab ────────────────────────────────────────────────────────
function SchoolProfileTab() {
  const { school, loading: schoolLoading } = useSchool();
  const [form, setForm]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef               = useRef();

  // Populate form once school loads
  useEffect(() => {
    if (!school) return;
    setForm({
      schoolName:    school.schoolName    ?? '',
      schoolCode:    school.schoolCode    ?? '',
      schoolType:    school.schoolType    ?? 'SECONDARY',
      city:          school.city          ?? '',
      country:       school.country       ?? '',
      postalAddress: school.postalAddress ?? '',
      phoneNumber:   school.phoneNumber   ?? '',
      email:         school.email         ?? '',
      motto:         school.motto         ?? '',
      schoolLogo:    school.schoolLogo    ?? '',
    });
    setPreview(school.schoolLogo || null);
  }, [school]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Handle logo file → Base64
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: 'Logo must be under 2 MB', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result;
      setPreview(b64);
      set('schoolLogo', b64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!school?.schoolId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE}/school/update/${school.schoolId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      // Update cache
      localStorage.setItem('schoolInfo', JSON.stringify({
        data: { ...school, ...form },
        ts: Date.now(),
      }));
      setToast({ message: 'School profile saved!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Save failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (schoolLoading || !form) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3" />
        Loading school data…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Logo upload */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">School Logo</p>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
            {preview
              ? <img src={preview} alt="logo" className="w-full h-full object-cover" />
              : <School size={28} className="text-gray-300" />
            }
          </div>
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <button
              onClick={() => fileRef.current.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload size={15} /> Upload Logo
            </button>
            {preview && (
              <button
                onClick={() => { setPreview(null); set('schoolLogo', ''); }}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <X size={15} /> Remove
              </button>
            )}
            <p className="text-xs text-gray-400">PNG, JPG up to 2 MB</p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
          <input
            value={form.schoolName}
            onChange={e => set('schoolName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Nairobi Academy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Code</label>
          <input
            value={form.schoolCode}
            onChange={e => set('schoolCode', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. NAI-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Type</label>
          <select
            value={form.schoolType}
            onChange={e => set('schoolType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PRIMARY">Primary</option>
            <option value="SECONDARY">Secondary</option>
            <option value="MIXED">Mixed (Primary & Secondary)</option>
            <option value="UNIVERSITY">University / College</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            value={form.phoneNumber}
            onChange={e => set('phoneNumber', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+254 700 000 000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="info@school.ac.ke"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Postal Address</label>
          <input
            value={form.postalAddress}
            onChange={e => set('postalAddress', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="P.O. Box 0000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input
            value={form.city}
            onChange={e => set('city', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nairobi"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <input
            value={form.country}
            onChange={e => set('country', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kenya"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">School Motto</label>
          <input
            value={form.motto}
            onChange={e => set('motto', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Excellence Through Knowledge"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save School Profile'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────────────
const Settings = () => {
  const role        = getRole();
  const isPrincipal = role === 'ROLE_PRINCIPAL';

  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      academicYear: "2024-2025",
      semester: "Spring",
      timezone: "UTC+03:00",
      language: "English",
      dateFormat: "DD/MM/YYYY",
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      gradeUpdates: true,
      newStudentAlerts: true,
      attendanceAlerts: true,
      weeklyReports: true,
      monthlySummaries: false,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      failedAttempts: 5,
      auditLogging: true,
    },
    appearance: {
      theme: "light",
      sidebarColor: "dark",
      density: "comfortable",
      fontSize: "medium",
      animations: true,
    },
    backup: {
      autoBackup: true,
      backupFrequency: "daily",
      backupTime: "02:00",
      keepBackups: 30,
      backupLocation: "cloud",
    }
  });

  const tabs = [
    { id: 'general',       label: 'General',        icon: <Globe size={18} />    },
    { id: 'notifications', label: 'Notifications',   icon: <Bell size={18} />     },
    { id: 'security',      label: 'Security',        icon: <Shield size={18} />   },
    { id: 'appearance',    label: 'Appearance',      icon: <Palette size={18} />  },
    { id: 'backup',        label: 'Backup',          icon: <Database size={18} /> },
    // Only show School Profile tab to principal
    ...(isPrincipal ? [{ id: 'school', label: 'School Profile', icon: <School size={18} /> }] : []),
  ];

  const handleInputChange = (category, field, value) => {
    setSettings(prev => ({ ...prev, [category]: { ...prev[category], [field]: value } }));
  };

  const handleToggle = (category, field) => {
    setSettings(prev => ({ ...prev, [category]: { ...prev[category], [field]: !prev[category][field] } }));
  };

  const handleSave = () => alert('Settings saved!');

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link    = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'settings_backup.json');
    link.click();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'school':
        return <SchoolProfileTab />;

      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                <input
                  type="text"
                  value={settings.general.academicYear}
                  onChange={e => handleInputChange('general', 'academicYear', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Semester</label>
                <select
                  value={settings.general.semester}
                  onChange={e => handleInputChange('general', 'semester', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Spring</option><option>Summer</option>
                  <option>Fall</option><option>Winter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={e => handleInputChange('general', 'timezone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC+03:00">East Africa Time (UTC+3)</option>
                  <option value="UTC+00:00">GMT (UTC+0)</option>
                  <option value="UTC-05:00">EST (UTC-5)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={settings.general.language}
                  onChange={e => handleInputChange('general', 'language', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>English</option><option>French</option><option>Swahili</option>
                </select>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
              <Building className="text-blue-600 shrink-0" size={20} />
              <div>
                <p className="font-medium text-blue-800 text-sm">General Settings</p>
                <p className="text-xs text-blue-600">These affect system-wide behaviour and display.</p>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Notification Preferences</h3>
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700 text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p>
                </div>
                <button
                  onClick={() => handleToggle('notifications', key)}
                  className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'} mx-0.5`} />
                </button>
              </div>
            ))}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Security Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700 text-sm">Two-Factor Auth</p>
                  <p className="text-xs text-gray-500">Extra security layer</p>
                </div>
                <button
                  onClick={() => handleToggle('security', 'twoFactorAuth')}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.security.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-0.5'} mx-0.5`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (min)</label>
                <input type="number" value={settings.security.sessionTimeout}
                  onChange={e => handleInputChange('security', 'sessionTimeout', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                <input type="number" value={settings.security.passwordExpiry}
                  onChange={e => handleInputChange('security', 'passwordExpiry', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Failed Attempts</label>
                <input type="number" value={settings.security.failedAttempts}
                  onChange={e => handleInputChange('security', 'failedAttempts', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Appearance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Theme', field: 'theme', opts: ['light','dark','auto'] },
                { label: 'Sidebar Color', field: 'sidebarColor', opts: ['dark','light','blue'] },
                { label: 'Font Size', field: 'fontSize', opts: ['small','medium','large'] },
                { label: 'Density', field: 'density', opts: ['compact','comfortable','spacious'] },
              ].map(({ label, field, opts }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                  <select value={settings.appearance[field]}
                    onChange={e => handleInputChange('appearance', field, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {opts.map(o => <option key={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Backup Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700 text-sm">Auto Backup</p>
                  <p className="text-xs text-gray-500">Automatically backup system data</p>
                </div>
                <button onClick={() => handleToggle('backup', 'autoBackup')}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.backup.autoBackup ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.backup.autoBackup ? 'translate-x-6' : 'translate-x-0.5'} mx-0.5`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select value={settings.backup.backupFrequency}
                  onChange={e => handleInputChange('backup', 'backupFrequency', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keep Backups (days)</label>
                <input type="number" value={settings.backup.keepBackups}
                  onChange={e => handleInputChange('backup', 'keepBackups', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600">Configure your institution's preferences</p>
        </div>
        {activeTab !== 'school' && (
          <div className="flex space-x-3">
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Download size={16} /> Export
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <Save size={16} /> Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        {renderTabContent()}
      </div>

      {/* Danger Zone */}
      <div className="mt-6 bg-white rounded-xl shadow-md border border-red-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-800">Danger Zone</h3>
            <p className="text-sm text-red-600">Irreversible actions. Proceed with caution.</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm">
              Reset All Settings
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;