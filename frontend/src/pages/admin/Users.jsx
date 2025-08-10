import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';
import toast from 'react-hot-toast';

const Users = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [realTimeUsers, setRealTimeUsers] = useState([]);

  // WebSocket event handlers for real-time user updates
  useEffect(() => {
    if (!currentUser) return;

    // Handle user login events
    const handleUserLogin = (data) => {
      queryClient.invalidateQueries(['users']);
      setRealTimeUsers(prev => {
        const existingUser = prev.find(u => u.id === data.userId);
        if (existingUser) {
          return prev.map(u => 
            u.id === data.userId 
              ? { ...u, isOnline: true, lastSeen: new Date().toISOString() }
              : u
          );
        }
        return prev;
      });
    };

    // Handle user logout events
    const handleUserLogout = (data) => {
      setRealTimeUsers(prev => 
        prev.map(u => 
          u.id === data.userId 
            ? { ...u, isOnline: false, lastSeen: new Date().toISOString() }
            : u
        )
      );
    };

    // Set up event listeners
    socketService.onUserLogin(handleUserLogin);
    socketService.onUserLogout(handleUserLogout);

    // Cleanup event listeners
    return () => {
      socketService.offUserLogin(handleUserLogin);
      socketService.offUserLogout(handleUserLogout);
    };
  }, [currentUser, queryClient]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT',
    phone: '',
    status: 'ACTIVE'
  });

  // Fetch all users
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users', searchTerm, selectedRole, selectedStatus],
    queryFn: () => userAPI.getAllUsers({ 
      search: searchTerm, 
      role: selectedRole !== 'all' ? selectedRole : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined
    }),
    refetchInterval: 30000
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData) => adminAPI.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User created successfully!');
      setShowAddModal(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'STUDENT',
        phone: '',
        status: 'ACTIVE'
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }) => adminAPI.updateUser(userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User updated successfully!');
      setShowAddModal(false);
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'STUDENT',
        phone: '',
        status: 'ACTIVE'
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => adminAPI.deleteUser(userId),
    onSuccess: () => {
      toast.success('User deleted successfully!');
      usersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });

  const handleAddUser = () => {
    if (formData.email && formData.password && formData.firstName && formData.lastName) {
      createUserMutation.mutate(formData);
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone || '',
      status: user.status
    });
    setShowAddModal(true);
  };

  const handleUpdateUser = () => {
    if (formData.firstName && formData.lastName) {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;
      updateUserMutation.mutate({ userId: editingUser.id, userData: updateData });
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const filteredUsers = usersData?.data?.users || [];
  
  // Debug logging
  console.log('Users Data:', usersData);
  console.log('Filtered Users:', filteredUsers);

  if (usersLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', color: 'var(--secondary-600)' }}>Loading users...</div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', color: 'var(--danger-600)' }}>Error loading users</div>
        <div style={{ fontSize: '16px', color: 'var(--secondary-600)', marginTop: '8px' }}>
          {usersError.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="data-table-container">
        <div className="data-table-header">
          <h2 className="data-table-title">Users Management</h2>
          <div className="data-table-actions">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--secondary-300)',
                borderRadius: '6px',
                marginRight: '12px'
              }}
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--secondary-300)',
                borderRadius: '6px',
                marginRight: '12px'
              }}
            >
              <option value="all">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="STUDENT">Student</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--secondary-300)',
                borderRadius: '6px',
                marginRight: '12px'
              }}
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setEditingUser(null);
                setFormData({
                  email: '',
                  password: '',
                  firstName: '',
                  lastName: '',
                  role: 'STUDENT',
                  phone: '',
                  status: 'ACTIVE'
                });
                setShowAddModal(true);
              }}
            >
              ➕ Add User
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Phone</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--secondary-900)' }}>
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${
                    user.role === 'SUPER_ADMIN' ? 'badge-danger' :
                    user.role === 'ADMIN' ? 'badge-warning' :
                    user.role === 'MODERATOR' ? 'badge-info' : 'badge-primary'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    user.status === 'ACTIVE' ? 'badge-success' :
                    user.status === 'INACTIVE' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.phone || '-'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="data-table-actions-cell">
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleEditUser(user)}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-600)' }}>
            No users found
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--secondary-300)',
                    borderRadius: '6px'
                  }}
                />
              </div>

              {!editingUser && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--secondary-300)',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={editingUser ? handleUpdateUser : handleAddUser}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                {createUserMutation.isPending || updateUserMutation.isPending ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 