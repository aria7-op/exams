import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    systemName: 'Mock Test Pro',
    defaultTestDuration: 60,
    maxStudentsPerTest: 50,
    autoGradeTests: true,
    emailNotifications: true,
    maintenanceMode: false,
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
          System Settings
        </h1>
        <p style={{ color: '#64748b' }}>
          Configure system preferences and behavior
        </p>
      </div>

      <div className="form-container">
        <div className="form-title">General Settings</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">System Name</label>
            <input
              type="text"
              className="form-input"
              value={settings.systemName}
              onChange={(e) => handleSettingChange('systemName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Default Test Duration (minutes)</label>
            <input
              type="number"
              className="form-input"
              value={settings.defaultTestDuration}
              onChange={(e) => handleSettingChange('defaultTestDuration', parseInt(e.target.value))}
              min="15"
              max="300"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max Students Per Test</label>
            <input
              type="number"
              className="form-input"
              value={settings.maxStudentsPerTest}
              onChange={(e) => handleSettingChange('maxStudentsPerTest', parseInt(e.target.value))}
              min="1"
              max="100"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Timezone</label>
            <select 
              className="form-select"
              value={settings.timezone}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
              <option value="GMT">GMT</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-container" style={{ marginTop: '2rem' }}>
        <div className="form-title">Feature Settings</div>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#1e293b' }}>Auto-Grade Tests</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Automatically grade tests upon completion</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
              <input
                type="checkbox"
                checked={settings.autoGradeTests}
                onChange={(e) => handleSettingChange('autoGradeTests', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.autoGradeTests ? '#667eea' : '#cbd5e1',
                borderRadius: '24px',
                transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.autoGradeTests ? '26px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s'
                }}></span>
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#1e293b' }}>Email Notifications</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Send email notifications for test results</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.emailNotifications ? '#667eea' : '#cbd5e1',
                borderRadius: '24px',
                transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.emailNotifications ? '26px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s'
                }}></span>
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#1e293b' }}>Maintenance Mode</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Put system in maintenance mode (admin only)</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.maintenanceMode ? '#ef4444' : '#cbd5e1',
                borderRadius: '24px',
                transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.maintenanceMode ? '26px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s'
                }}></span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button className="btn btn-primary">Save Settings</button>
        <button className="btn btn-secondary">Reset to Default</button>
      </div>
    </div>
  );
};

export default Settings; 