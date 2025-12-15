import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from './Loader';
import Message from './Message';
import './UserManagement.css';
import AddUserForm from './AddUserForm'; // Import the new form component

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get('/api/users/all', config);
        setUsers(data);
      } catch (err) {
        const message =
          err.response && err.response.data && err.response.data.message
            ? err.response.data.message
            : 'Failed to fetch users.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleBlockToggle = async (userId, isBlocked) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.put(
        `/api/users/${userId}/toggle-block`, 
        { isBlocked: !isBlocked },
        config
      );

      setUsers(users.map(user =>
        user._id === userId ? data : user // Replace the old user with the updated one from the server
      ));
    } catch (err) {
      const message =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : 'Failed to update user status.';
      setError(message);
    }
  };

  const getRoleName = (role) => {
    if (!role) return 'N/A';
    if (typeof role === 'string') return role;
    if (typeof role === 'object' && role.name && typeof role.name === 'string') return role.name;
    return 'Invalid Role';
  };

  const renderStatus = (user) => {
    // A user is considered "Blocked" if their isActive status is false.
    // Users where isActive is undefined (older users) will be treated as active.
    if (user.isActive === false) { 
      return <span className="status-tag status-blocked">Blocked</span>
    }
    // All non-blocked users are considered Active
    return <span className="status-tag status-active">Active</span>;
  };

  const handleNewUser = (newUser) => {
    // Add the newly created user to the top of the list for immediate feedback
    setUsers([newUser, ...users]);
  };

  // New stat calculations
  const stats = {
    total: users.length,
    admins: users.filter(u => getRoleName(u.role).toLowerCase() === 'admin').length,
    emergencyOfficers: users.filter(u => getRoleName(u.role).toLowerCase() === 'emergency').length,
    ngos: users.filter(u => getRoleName(u.role).toLowerCase() === 'ngo').length,
    volunteers: users.filter(u => getRoleName(u.role).toLowerCase() === 'volunteer').length,
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  return (
    <div className="user-management-view">
      {isModalOpen && <AddUserForm onFormSubmit={handleNewUser} onClose={() => setIsModalOpen(false)} />}
      <div className="view-header">
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Add User
        </button>
      </div>
      <div className="stats-cards">
        <div className="stat-card color-total">
          <h3>Total Users</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card color-admin">
          <h3>Admins</h3>
          <p>{stats.admins}</p>
        </div>
        <div className="stat-card color-emergency">
          <h3>Emergency Officers</h3>
          <p>{stats.emergencyOfficers}</p>
        </div>
        <div className="stat-card color-ngo">
          <h3>NGOs</h3>
          <p>{stats.ngos}</p>
        </div>
        <div className="stat-card color-volunteer">
          <h3>Volunteers</h3>
          <p>{stats.volunteers}</p>
        </div>
      </div>
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className={!user.isActive ? 'blocked-row' : ''}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td className="role-cell">{getRoleName(user.role)}</td>
                <td>{renderStatus(user)}</td>
                <td className="actions-cell">
                  {/* Simplified Actions: Only show Block/Unblock */}
                  <button
                    className={!user.isActive ? 'btn-unblock' : 'btn-block'}
                    onClick={() => handleBlockToggle(user._id, !user.isActive)}>
                    {!user.isActive ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
