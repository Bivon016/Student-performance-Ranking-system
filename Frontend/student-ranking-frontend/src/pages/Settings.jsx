import React, { useState } from 'react';
import { 
  Save, 
  Globe, 
  Building, 
  Calendar,
  Bell,
  Shield,
  Palette,
  Database,
  Download
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      institutionName: "University of Excellence",
      institutionType: "University",
      academicYear: "2024-2025",
      semester: "Spring",
      timezone: "UTC+03:00",
      language: "English",
      dateFormat: "DD/MM/YYYY",
      currency: "USD",
      maxStudents: 5000,
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
      ipWhitelist: "",
      auditLogging: true,
    },
    appearance: {
      theme: "light",
      primaryColor: "#3B82F6",
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
    { id: 'general', label: 'General', icon: <Globe size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'backup', label: 'Backup', icon: <Database size={18} /> },
  ];

  const handleInputChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleToggle = (category, field) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field]
      }
    }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'settings_backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institution Name
          </label>
          <input
            type="text"
            value={settings.general.institutionName}
            onChange={(e) => handleInputChange('general', 'institutionName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter institution name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institution Type
          </label>
          <select
            value={settings.general.institutionType}
            onChange={(e) => handleInputChange('general', 'institutionType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="University">University</option>
            <option value="College">College</option>
            <option value="School">School</option>
            <option value="Training Center">Training Center</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic Year
          </label>
          <input
            type="text"
            value={settings.general.academicYear}
            onChange={(e) => handleInputChange('general', 'academicYear', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2024-2025"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Semester
          </label>
          <select
            value={settings.general.semester}
            onChange={(e) => handleInputChange('general', 'semester', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Spring">Spring</option>
            <option value="Summer">Summer</option>
            <option value="Fall">Fall</option>
            <option value="Winter">Winter</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UTC+03:00">East Africa Time (UTC+3)</option>
            <option value="UTC+00:00">GMT (UTC+0)</option>
            <option value="UTC-05:00">EST (UTC-5)</option>
            <option value="UTC+08:00">CST (UTC+8)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={settings.general.language}
            onChange={(e) => handleInputChange('general', 'language', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="Arabic">Arabic</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Building className="text-blue-600 mr-3" size={20} />
          <div>
            <h4 className="font-medium text-blue-800">Institution Information</h4>
            <p className="text-sm text-blue-600">These settings affect how your institution appears throughout the system.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch(activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Notification Preferences</h3>
            <div className="space-y-4">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-700">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
                    <p className="text-sm text-gray-500">Receive notifications for {key.replace(/([A-Z])/g, ' ').toLowerCase()}</p>
                  </div>
                  <button
                    onClick={() => handleToggle('notifications', key)}
                    className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${value ? 'translate-x-7' : 'translate-x-1'} mt-0.5`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Security Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-700">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add extra security layer</p>
                  </div>
                  <button
                    onClick={() => handleToggle('security', 'twoFactorAuth')}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.security.twoFactorAuth ? 'bg-red-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.security.twoFactorAuth ? 'translate-x-7' : 'translate-x-1'} mt-0.5`} />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleInputChange('security', 'sessionTimeout', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Expiry (days)
                  </label>
                  <input
                    type="number"
                    value={settings.security.passwordExpiry}
                    onChange={(e) => handleInputChange('security', 'passwordExpiry', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Failed Attempts
                  </label>
                  <input
                    type="number"
                    value={settings.security.failedAttempts}
                    onChange={(e) => handleInputChange('security', 'failedAttempts', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Appearance Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={settings.appearance.theme}
                  onChange={(e) => handleInputChange('appearance', 'theme', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sidebar Color
                </label>
                <select
                  value={settings.appearance.sidebarColor}
                  onChange={(e) => handleInputChange('appearance', 'sidebarColor', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="blue">Blue</option>
                  <option value="gradient">Gradient</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <select
                  value={settings.appearance.fontSize}
                  onChange={(e) => handleInputChange('appearance', 'fontSize', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Density
                </label>
                <select
                  value={settings.appearance.density}
                  onChange={(e) => handleInputChange('appearance', 'density', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-700">Animations</p>
                <p className="text-sm text-gray-500">Enable UI animations and transitions</p>
              </div>
              <button
                onClick={() => handleToggle('appearance', 'animations')}
                className={`w-12 h-6 rounded-full transition-colors ${settings.appearance.animations ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.appearance.animations ? 'translate-x-7' : 'translate-x-1'} mt-0.5`} />
              </button>
            </div>
          </div>
        );
      case 'backup':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Backup Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">Auto Backup</p>
                  <p className="text-sm text-gray-500">Automatically backup system data</p>
                </div>
                <button
                  onClick={() => handleToggle('backup', 'autoBackup')}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.backup.autoBackup ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.backup.autoBackup ? 'translate-x-7' : 'translate-x-1'} mt-0.5`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Backup Frequency
                </label>
                <select
                  value={settings.backup.backupFrequency}
                  onChange={(e) => handleInputChange('backup', 'backupFrequency', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keep Backups (days)
                </label>
                <input
                  type="number"
                  value={settings.backup.keepBackups}
                  onChange={(e) => handleInputChange('backup', 'keepBackups', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Backup Location
                </label>
                <select
                  value={settings.backup.backupLocation}
                  onChange={(e) => handleInputChange('backup', 'backupLocation', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cloud">Cloud Storage</option>
                  <option value="local">Local Server</option>
                  <option value="external">External Drive</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Database className="text-yellow-600 mr-3" size={20} />
                <div>
                  <h4 className="font-medium text-yellow-800">Backup Information</h4>
                  <p className="text-sm text-yellow-600">Regular backups help protect your data from loss or corruption.</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600">Configure your institution's preferences and system behavior</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            <span>Export Settings</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={18} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
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
            <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
              Reset All Settings
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;