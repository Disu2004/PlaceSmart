import { useState, useEffect } from 'react';
import axios from 'axios';

// Main App Router Component
export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // home, users, resumes
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const renderPage = () => {
    switch(currentPage) {
      case 'users':
        return <UsersManagement onBack={() => setCurrentPage('home')} />;
      case 'resumes':
        return <ResumeManagement onBack={() => setCurrentPage('home')} />;
      default:
        return <AdminHome onNavigate={setCurrentPage} />;
    }
  };

  return renderPage();
}

// Admin Home Page
function AdminHome({ onNavigate }) {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)', 
      minHeight: '100vh', 
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        opacity: 0.1,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 20% 50%, #FFD700 0%, transparent 50%), radial-gradient(circle at 80% 80%, #FFA500 0%, transparent 50%)',
        animation: 'pulse 4s ease-in-out infinite'
      }} />

      <div style={{ 
        textAlign: 'center', 
        marginBottom: '60px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'inline-block',
          padding: '8px 24px',
          background: 'linear-gradient(90deg, #FFD700, #FFA500)',
          borderRadius: '50px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: '700',
          color: '#000',
          letterSpacing: '2px'
        }}>
          ⚙️ ADMIN CONTROL PANEL
        </div>
        
        <h1 style={{ 
          color: '#FFD700', 
          fontSize: '56px', 
          fontWeight: '900',
          marginBottom: '15px',
          textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
          letterSpacing: '2px'
        }}>
          Admin Dashboard
        </h1>
        
        <p style={{ 
          color: '#FFA500', 
          fontSize: '20px',
          fontWeight: '600',
          opacity: 0.9
        }}>
          Manage Your Platform
        </p>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '40px',
        position: 'relative',
        zIndex: 10
      }}>
        <div 
          onClick={() => onNavigate('users')}
          style={{
            background: 'linear-gradient(135deg, #1a1a1a, #000)',
            borderRadius: '24px',
            padding: '50px 40px',
            border: '3px solid rgba(255,215,0,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            transition: 'all 0.4s ease',
            cursor: 'pointer',
            textAlign: 'center'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 30px 80px rgba(255,215,0,0.5)';
            e.currentTarget.style.borderColor = '#FFD700';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.8)';
            e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)';
          }}>
          <div style={{
            fontSize: '72px',
            marginBottom: '30px'
          }}>
            👥
          </div>
          <h2 style={{
            color: '#FFD700',
            fontSize: '32px',
            fontWeight: '900',
            marginBottom: '15px',
            letterSpacing: '1px'
          }}>
            User Management
          </h2>
          <p style={{
            color: '#FFA500',
            fontSize: '18px',
            lineHeight: '1.6',
            marginBottom: '30px'
          }}>
            View, edit, and manage all registered users
          </p>
          <div style={{
            display: 'inline-block',
            padding: '14px 35px',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#000',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            boxShadow: '0 4px 20px rgba(255,215,0,0.4)'
          }}>
            Manage Users →
          </div>
        </div>

        <div 
          onClick={() => onNavigate('resumes')}
          style={{
            background: 'linear-gradient(135deg, #1a1a1a, #000)',
            borderRadius: '24px',
            padding: '50px 40px',
            border: '3px solid rgba(255,215,0,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            transition: 'all 0.4s ease',
            cursor: 'pointer',
            textAlign: 'center'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 30px 80px rgba(255,215,0,0.5)';
            e.currentTarget.style.borderColor = '#FFD700';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.8)';
            e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)';
          }}>
          <div style={{
            fontSize: '72px',
            marginBottom: '30px'
          }}>
            📄
          </div>
          <h2 style={{
            color: '#FFD700',
            fontSize: '32px',
            fontWeight: '900',
            marginBottom: '15px',
            letterSpacing: '1px'
          }}>
            Resume Templates
          </h2>
          <p style={{
            color: '#FFA500',
            fontSize: '18px',
            lineHeight: '1.6',
            marginBottom: '30px'
          }}>
            Add, update, and delete resume templates
          </p>
          <div style={{
            display: 'inline-block',
            padding: '14px 35px',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#000',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            boxShadow: '0 4px 20px rgba(255,215,0,0.4)'
          }}>
            Manage Templates →
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}

// Users Management Page
function UsersManagement({ onBack }) {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'User', created: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Admin', created: '2024-01-20' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteUser = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)', 
      minHeight: '100vh', 
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{
              color: '#FFD700',
              fontSize: '48px',
              fontWeight: '900',
              marginBottom: '10px'
            }}>
              👥 User Management
            </h1>
            <p style={{ color: '#FFA500', fontSize: '18px' }}>
              Total Users: {users.length}
            </p>
          </div>
          <button 
            onClick={onBack}
            style={{
              padding: '14px 28px',
              background: 'rgba(255,255,255,0.1)',
              color: '#FFD700',
              border: '2px solid rgba(255,215,0,0.5)',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer'
            }}>
            ← Back to Dashboard
          </button>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <input
            type="text"
            placeholder="🔍 Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '16px 24px',
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(255,215,0,0.3)',
              borderRadius: '12px',
              color: '#FFD700',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a, #000)',
          borderRadius: '16px',
          border: '2px solid rgba(255,215,0,0.3)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 2fr 120px 180px',
            gap: '20px',
            padding: '20px 30px',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#000',
            fontWeight: '900',
            fontSize: '14px'
          }}>
            <div>ID</div>
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Actions</div>
          </div>

          {filteredUsers.map((user, i) => (
            <div key={user.id} style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 2fr 120px 180px',
              gap: '20px',
              padding: '25px 30px',
              borderBottom: i !== filteredUsers.length - 1 ? '1px solid rgba(255,215,0,0.2)' : 'none',
              alignItems: 'center'
            }}>
              <div style={{ color: '#FFA500', fontWeight: '700' }}>#{user.id}</div>
              <div style={{ color: '#FFD700', fontWeight: '600' }}>{user.name}</div>
              <div style={{ color: '#FFA500', fontSize: '14px' }}>{user.email}</div>
              <div>
                <span style={{
                  padding: '6px 14px',
                  background: user.role === 'Admin' ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 'rgba(255,215,0,0.2)',
                  color: user.role === 'Admin' ? '#000' : '#FFD700',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {user.role}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{
                  padding: '8px 16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  ✏️ Edit
                </button>
                <button
                  onClick={() => deleteUser(user.id)}
                  style={{
                  padding: '8px 16px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Resume Management Page
function ResumeManagement({ onBack }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', html: '', css: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/resume/resumes');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/resume/admin/resumes/${editingId}`, formData);
      } else {
        await axios.post('http://localhost:8000/resume/admin/resumes', formData);
      }

      fetchTemplates();
      setShowForm(false);
      setFormData({ name: '', html: '', css: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save template');
    }
    setLoading(false);
  };

  const handleEdit = (template) => {
    setFormData({ name: template.name, html: template.html, css: template.css });
    setEditingId(template.resumeId);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;

    try {
      await axios.delete(`http://localhost:8000/resume/admin/resumes/${id}`);
      fetchTemplates();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete template');
    }
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)', 
      minHeight: '100vh', 
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{
              color: '#FFD700',
              fontSize: '48px',
              fontWeight: '900',
              marginBottom: '10px'
            }}>
              📄 Resume Templates
            </h1>
            <p style={{ color: '#FFA500', fontSize: '18px' }}>
              Total: {templates.length}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setFormData({ name: '', html: '', css: '' });
              }}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer'
              }}>
              ➕ Add Template
            </button>
            <button 
              onClick={onBack}
              style={{
                padding: '14px 28px',
                background: 'rgba(255,255,255,0.1)',
                color: '#FFD700',
                border: '2px solid rgba(255,215,0,0.5)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer'
              }}>
              ← Back
            </button>
          </div>
        </div>

        {showForm && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a, #000)',
            borderRadius: '16px',
            border: '2px solid rgba(255,215,0,0.3)',
            padding: '40px',
            marginBottom: '40px'
          }}>
            <h2 style={{ color: '#FFD700', fontSize: '28px', fontWeight: '900', marginBottom: '30px' }}>
              {editingId ? '✏️ Edit Template' : '➕ Add New Template'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ color: '#FFA500', fontSize: '16px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,215,0,0.3)',
                    borderRadius: '10px',
                    color: '#FFD700',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ color: '#FFA500', fontSize: '16px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                  HTML Code
                </label>
                <textarea
                  value={formData.html}
                  onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                  required
                  rows="8"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,215,0,0.3)',
                    borderRadius: '10px',
                    color: '#FFD700',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ marginBottom: '30px' }}>
                <label style={{ color: '#FFA500', fontSize: '16px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                  CSS Code
                </label>
                <textarea
                  value={formData.css}
                  onChange={(e) => setFormData({ ...formData, css: e.target.value })}
                  required
                  rows="8"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,215,0,0.3)',
                    borderRadius: '10px',
                    color: '#FFD700',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '14px 40px',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}>
                  {loading ? 'Saving...' : (editingId ? 'Update' : 'Add Template')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '', html: '', css: '' });
                  }}
                  style={{
                    padding: '14px 40px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#FFD700',
                    border: '2px solid rgba(255,215,0,0.5)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && !showForm && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#FFD700', fontSize: '24px' }}>
            Loading...
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '30px'
        }}>
          {templates.map((template) => (
            <div key={template.resumeId} style={{
              background: 'linear-gradient(135deg, #1a1a1a, #000)',
              borderRadius: '16px',
              border: '2px solid rgba(255,215,0,0.3)',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                height: '200px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '48px'
              }}>
                📄
              </div>
              <div style={{ padding: '25px' }}>
                <h3 style={{
                  color: '#FFD700',
                  fontSize: '22px',
                  fontWeight: '900',
                  marginBottom: '20px'
                }}>
                  {template.name}
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleEdit(template)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}>
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template.resumeId)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && templates.length === 0 && !showForm && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#FFA500'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
            <h2 style={{ fontSize: '28px', marginBottom: '10px', color: '#FFD700' }}>No Templates Yet</h2>
            <p style={{ fontSize: '18px' }}>Click "Add Template" to create your first resume template</p>
          </div>
        )}
      </div>
    </div>
  );
}