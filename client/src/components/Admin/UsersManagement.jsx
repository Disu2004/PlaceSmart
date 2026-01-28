import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:8000";

export default function UsersManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${BACKEND_URL}/user/fetch-users`);
      const usersData = response.data?.users || response.data || [];
      setUsers(usersData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to delete user ${userId}?`)) return;
    
    setLoading(true);
    try {
      const response = await axios.delete(`${BACKEND_URL}/user/delete-user/${userId}`);
      if (response.data.success) {
        alert('User deleted successfully!');
        await fetchUsers();
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user) => {
    console.log('Opening edit modal for user:', user);
    setEditingUser({
      id: user.id,
      userDesignation: user.userDesignation,
      imageurl: user.imageurl
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    console.log('Closing edit modal');
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting edit for user:', editingUser);
    
    setLoading(true);
    try {
      const response = await axios.put(
        `${BACKEND_URL}/user/edit-user/${editingUser.id}`,
        {
          userDesignation: editingUser.userDesignation,
          imageurl: editingUser.imageurl
        }
      );
      
      console.log('Edit response:', response.data);
      
      if (response.data.success) {
        alert('User updated successfully!');
        closeEditModal();
        await fetchUsers();
      }
    } catch (err) {
      console.error('Edit error:', err);
      console.error('Error response:', err.response?.data);
      alert(err.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user?.id?.toLowerCase().includes(search) ||
      user?.userDesignation?.toLowerCase().includes(search)
    );
  });

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>👥 User Management</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>Total Users: {users.length}</p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          ← Back
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '15px', 
          background: '#fee', 
          color: '#c00', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          ❌ {error}
        </div>
      )}

      <input
        type="text"
        placeholder="🔍 Search by ID or designation..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '15px',
          marginBottom: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '1rem',
          boxSizing: 'border-box'
        }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', fontSize: '1.5rem' }}>
          ⏳ Loading...
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredUsers.map((user) => (
            <div 
              key={user._id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <img 
                  src={user.imageurl} 
                  alt={`User ${user.id}`}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: '15px'
                  }}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/80'}
                />
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>ID: {user.id}</h3>
                  <p style={{ margin: 0, textTransform: 'capitalize' }}>
                    {user.userDesignation}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => {
                    console.log('Edit button clicked for user:', user.id);
                    openEditModal(user);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={() => deleteUser(user.id)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div 
          onClick={closeEditModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <h2 style={{ marginTop: 0 }}>✏️ Edit User</h2>
            
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  User ID
                </label>
                <input
                  type="text"
                  value={editingUser.id}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    background: '#f5f5f5',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Designation *
                </label>
                <select
                  value={editingUser.userDesignation}
                  onChange={(e) => setEditingUser({ ...editingUser, userDesignation: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Image URL *
                </label>
                <input
                  type="url"
                  value={editingUser.imageurl}
                  onChange={(e) => setEditingUser({ ...editingUser, imageurl: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {editingUser.imageurl && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <img 
                    src={editingUser.imageurl}
                    alt="Preview"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => e.target.src = 'https://via.placeholder.com/100'}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: loading ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Saving...' : '💾 Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}