import React, { useState, useEffect, useRef } from 'react';
import {
  Save, Palette, Database, Download, School, Upload, X,
  Sun, Moon, Monitor, HardDrive, Clock, CheckCircle
} from 'lucide-react';
import { useSchool } from '../hooks/useSchool';
import { getRole, uploadSchoolLogo, removeSchoolLogo } from '../services/api';
import { API_BASE } from '../config';
import { resolveLogoUrl } from '../utils/logoUrl';
import { Toast } from '../components/UserMessage';
import { getFriendlyError } from '../utils/errorMessages';
import { useTheme, BACKUP_KEY } from '../contexts/ThemeContext';

const BASE = API_BASE;

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

function SchoolProfileTab() {
  const { school, loading: schoolLoading } = useSchool();
  const [form, setForm]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef               = useRef();

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
    setPreview(resolveLogoUrl(school.schoolLogo) || null);
  }, [school]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !school?.schoolId) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: 'Logo must be under 2 MB', type: 'error' });
      return;
    }

    setUploadingLogo(true);
    try {
      const data = await uploadSchoolLogo(school.schoolId, file);
      const logoPath = data.logoUrl || data.schoolLogo;
      set('schoolLogo', logoPath);
      setPreview(resolveLogoUrl(logoPath));
      localStorage.setItem('schoolInfo', JSON.stringify({
        data: { ...school, ...form, schoolLogo: logoPath },
        ts: Date.now(),
      }));
      setToast({ message: 'Logo uploaded successfully', type: 'success' });
    } catch (err) {
      setToast({ message: getFriendlyError(err), type: 'error' });
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!school?.schoolId) return;
    setUploadingLogo(true);
    try {
      await removeSchoolLogo(school.schoolId);
      setPreview(null);
      set('schoolLogo', '');
      localStorage.setItem('schoolInfo', JSON.stringify({
        data: { ...school, ...form, schoolLogo: '' },
        ts: Date.now(),
      }));
      setToast({ message: 'Logo removed', type: 'success' });
    } catch (err) {
      setToast({ message: getFriendlyError(err), type: 'error' });
    } finally {
      setUploadingLogo(false);
    }
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
      localStorage.setItem('schoolInfo', JSON.stringify({
        data: { ...school, ...form },
        ts: Date.now(),
      }));
      setToast({ message: 'School profile saved!', type: 'success' });
    } catch (err) {
      setToast({ message: getFriendlyError(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (schoolLoading || !form) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3" />
        Loading school data…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
        <School className="text-indigo-600 dark:text-indigo-400 shrink-0" size={24} />
        <div>
          <p className="font-semibold text-indigo-900 dark:text-indigo-200">School Profile</p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">This information appears on report cards and exports.</p>
        </div>
      </div>

      <div>
        <p className={labelCls}>School Logo</p>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700">
            {preview
              ? <img src={preview} alt="logo" className="w-full h-full object-cover" />
              : <School size={32} className="text-gray-300 dark:text-gray-500" />
            }
          </div>
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Upload size={15} /> {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
            </button>
            {preview && (
              <button
                onClick={handleRemoveLogo}
                disabled={uploadingLogo}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
              >
                <X size={15} /> Remove
              </button>
            )}
            <p className="text-xs text-gray-400">PNG or JPG, up to 2 MB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'School Name *', field: 'schoolName', placeholder: 'e.g. Nairobi Academy' },
          { label: 'School Code', field: 'schoolCode', placeholder: 'e.g. NAI-001' },
          { label: 'Phone Number', field: 'phoneNumber', placeholder: '+254 700 000 000' },
          { label: 'Email', field: 'email', placeholder: 'info@school.ac.ke', type: 'email' },
          { label: 'Postal Address', field: 'postalAddress', placeholder: 'P.O. Box 0000' },
          { label: 'City', field: 'city', placeholder: 'Nairobi' },
          { label: 'Country', field: 'country', placeholder: 'Kenya' },
        ].map(({ label, field, placeholder, type = 'text' }) => (
          <div key={field}>
            <label className={labelCls}>{label}</label>
            <input
              type={type}
              value={form[field]}
              onChange={e => set(field, e.target.value)}
              className={inputCls}
              placeholder={placeholder}
            />
          </div>
        ))}

        <div>
          <label className={labelCls}>School Type</label>
          <select value={form.schoolType} onChange={e => set('schoolType', e.target.value)} className={inputCls}>
            <option value="PRIMARY">Primary</option>
            <option value="SECONDARY">Secondary</option>
            <option value="MIXED">Mixed (Primary & Secondary)</option>
            <option value="UNIVERSITY">University / College</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>School Motto</label>
          <input
            value={form.motto}
            onChange={e => set('motto', e.target.value)}
            className={inputCls}
            placeholder="e.g. Excellence Through Knowledge"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-lg shadow-indigo-500/20"
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save School Profile'}
        </button>
      </div>
    </div>
  );
}

function AppearanceTab() {
  const { theme, setTheme, isDark } = useTheme();
  const [toast, setToast] = useState(null);

  const themes = [
    { id: 'light', label: 'Light', icon: Sun, desc: 'Clean bright interface' },
    { id: 'dark',  label: 'Dark',  icon: Moon, desc: 'Easy on the eyes' },
    { id: 'auto',  label: 'System', icon: Monitor, desc: 'Match your device' },
  ];

  const handleSelect = (id) => {
    setTheme(id);
    setToast({ message: `Theme set to ${id === 'auto' ? 'system default' : id}`, type: 'success' });
  };

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Color Theme</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose how the application looks across all pages.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themes.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                theme === id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-lg shadow-indigo-500/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              {theme === id && (
                <CheckCircle size={18} className="absolute top-3 right-3 text-indigo-600 dark:text-indigo-400" />
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                id === 'dark' ? 'bg-gray-800 text-yellow-300' :
                id === 'auto' ? 'bg-gradient-to-br from-gray-100 to-gray-800 text-white' :
                'bg-gradient-to-br from-blue-50 to-indigo-100 text-indigo-600'
              }`}>
                <Icon size={22} />
              </div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</p>
        <div className={`rounded-xl p-4 border transition-colors ${
          isDark
            ? 'bg-gray-900 border-gray-700 text-gray-100'
            : 'bg-white border-gray-200 text-gray-800'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" />
            <div>
              <p className="text-sm font-semibold">Student Ranking System</p>
              <p className="text-xs opacity-60">Dashboard preview</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-indigo-500/30">
            <div className="h-2 w-2/3 rounded-full bg-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BackupTab() {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(BACKUP_KEY) || '{}');
    } catch {
      return {};
    }
  });
  const [toast, setToast] = useState(null);
  const importRef = useRef();

  const backupConfig = {
    autoBackup: settings.autoBackup ?? true,
    backupFrequency: settings.backupFrequency ?? 'weekly',
    backupTime: settings.backupTime ?? '02:00',
    keepBackups: settings.keepBackups ?? 30,
    lastBackup: settings.lastBackup ?? null,
  };

  const saveConfig = (next) => {
    const merged = { ...backupConfig, ...next };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(merged));
    setSettings(merged);
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      theme: localStorage.getItem('appTheme'),
      backupSettings: backupConfig,
      user: JSON.parse(localStorage.getItem('user') || '{}'),
      schoolInfo: JSON.parse(localStorage.getItem('schoolInfo') || 'null'),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `school_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    saveConfig({ lastBackup: new Date().toISOString() });
    setToast({ message: 'Backup downloaded successfully', type: 'success' });
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.theme) setTheme(data.theme);
        if (data.backupSettings) localStorage.setItem(BACKUP_KEY, JSON.stringify(data.backupSettings));
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        if (data.schoolInfo) localStorage.setItem('schoolInfo', JSON.stringify(data.schoolInfo));
        setSettings(data.backupSettings || {});
        setToast({ message: 'Backup restored successfully', type: 'success' });
      } catch {
        setToast({ message: 'Invalid backup file', type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <HardDrive className="text-emerald-600 dark:text-emerald-400 mb-3" size={24} />
          <p className="font-semibold text-gray-800 dark:text-gray-100">Export Backup</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
            Download your settings, theme preferences, and school cache as a JSON file.
          </p>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Download size={16} /> Download Backup
          </button>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <Upload className="text-blue-600 dark:text-blue-400 mb-3" size={24} />
          <p className="font-semibold text-gray-800 dark:text-gray-100">Restore Backup</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
            Import a previously exported backup file to restore your preferences.
          </p>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button
            onClick={() => importRef.current.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Upload size={16} /> Import Backup
          </button>
        </div>
      </div>

      {backupConfig.lastBackup && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock size={16} />
          Last backup: {new Date(backupConfig.lastBackup).toLocaleString()}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Auto-Backup Schedule</h3>

        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">Enable Auto-Backup Reminders</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Get reminded to export your data regularly</p>
          </div>
          <button
            onClick={() => saveConfig({ autoBackup: !backupConfig.autoBackup })}
            className={`w-12 h-6 rounded-full transition-colors ${backupConfig.autoBackup ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${backupConfig.autoBackup ? 'translate-x-6' : 'translate-x-0.5'} mx-0.5`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Frequency</label>
            <select
              value={backupConfig.backupFrequency}
              onChange={e => saveConfig({ backupFrequency: e.target.value })}
              className={inputCls}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Preferred Time</label>
            <input
              type="time"
              value={backupConfig.backupTime}
              onChange={e => saveConfig({ backupTime: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const Settings = () => {
  const role = getRole();
  const isPrincipal = role === 'ROLE_PRINCIPAL';
  const [activeTab, setActiveTab] = useState('appearance');

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'backup',     label: 'Backup',     icon: <Database size={18} /> },
    ...(isPrincipal ? [{ id: 'school', label: 'School Profile', icon: <School size={18} /> }] : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance': return <AppearanceTab />;
      case 'backup':     return <BackupTab />;
      case 'school':     return <SchoolProfileTab />;
      default:           return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage appearance, backups, and school profile</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;
