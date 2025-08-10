import React, { useState } from 'react';

const StudentProfile = () => {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    dateOfBirth: '1995-05-15',
    joinDate: '2023-09-01',
    testsTaken: 8,
    averageScore: 85,
    bestScore: 92,
    totalTime: 420
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...profile });

  const handleSave = () => {
    setProfile(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ ...profile });
    setIsEditing(false);
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Profile Card */}
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              margin: '0 auto 16px'
            }}>
              👤
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)', margin: '0 0 8px' }}>
              {profile.name}
            </h2>
            <p style={{ color: 'var(--secondary-600)', margin: 0 }}>
              Student
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--secondary-600)' }}>Member since:</span>
              <span style={{ fontWeight: '500' }}>{new Date(profile.joinDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--secondary-600)' }}>Tests taken:</span>
              <span style={{ fontWeight: '500' }}>{profile.testsTaken}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--secondary-600)' }}>Average score:</span>
              <span style={{ fontWeight: '500', color: 'var(--success-600)' }}>{profile.averageScore}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--secondary-600)' }}>Best score:</span>
              <span style={{ fontWeight: '500', color: 'var(--warning-600)' }}>{profile.bestScore}%</span>
            </div>
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => setIsEditing(true)}
            style={{ width: '100%' }}
          >
            ✏️ Edit Profile
          </button>
        </div>

        {/* Profile Details */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Profile Information</h3>
          </div>

          {isEditing ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--secondary-700)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--secondary-300)',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--secondary-700)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--secondary-300)',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--secondary-700)' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--secondary-300)',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--secondary-700)' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={editData.dateOfBirth}
                  onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--secondary-300)',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" onClick={handleSave}>
                  💾 Save Changes
                </button>
                <button className="btn btn-secondary" onClick={handleCancel}>
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--secondary-700)' }}>
                  Full Name
                </label>
                <div style={{ padding: '12px', backgroundColor: 'var(--secondary-50)', borderRadius: '6px', color: 'var(--secondary-900)' }}>
                  {profile.name}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--secondary-700)' }}>
                  Email
                </label>
                <div style={{ padding: '12px', backgroundColor: 'var(--secondary-50)', borderRadius: '6px', color: 'var(--secondary-900)' }}>
                  {profile.email}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--secondary-700)' }}>
                  Phone Number
                </label>
                <div style={{ padding: '12px', backgroundColor: 'var(--secondary-50)', borderRadius: '6px', color: 'var(--secondary-900)' }}>
                  {profile.phone}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--secondary-700)' }}>
                  Date of Birth
                </label>
                <div style={{ padding: '12px', backgroundColor: 'var(--secondary-50)', borderRadius: '6px', color: 'var(--secondary-900)' }}>
                  {new Date(profile.dateOfBirth).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="dashboard-card" style={{ marginTop: '24px' }}>
        <div className="dashboard-card-header">
          <h3 className="dashboard-card-title">Performance Statistics</h3>
        </div>
        <div className="dashboard-grid">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-600)', marginBottom: '8px' }}>
              {profile.testsTaken}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>
              Tests Completed
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--success-600)', marginBottom: '8px' }}>
              {profile.averageScore}%
            </div>
            <div style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>
              Average Score
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--warning-600)', marginBottom: '8px' }}>
              {profile.bestScore}%
            </div>
            <div style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>
              Best Score
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--danger-600)', marginBottom: '8px' }}>
              {profile.totalTime}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>
              Total Minutes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile; 