import React, { useState } from 'react';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'Software Engineer',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    bio: 'Passionate software engineer with 5+ years of experience in full-stack development.',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
    joinDate: '2022-03-15'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);

  const stats = [
    { label: 'Days Worked', value: '156' },
    { label: 'Tasks Completed', value: '89' },
    { label: 'Projects', value: '12' },
    { label: 'Attendance Rate', value: '96%' }
  ];

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg">
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end space-x-6">
              <div className="relative">
                <img
                  className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800"
                  src={profile.avatar}
                  alt={profile.name}
                />
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                <p className="text-blue-100">{profile.role} • {profile.department}</p>
              </div>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white text-blue-600 rounded hover:bg-gray-100"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.location}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Role</span>
                  <p className="text-gray-900 dark:text-gray-100">{profile.role}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Department</span>
                  <p className="text-gray-900 dark:text-gray-100">{profile.department}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Joined</span>
                  <p className="text-gray-900 dark:text-gray-100">{new Date(profile.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 