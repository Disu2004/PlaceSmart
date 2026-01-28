import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:8000";

export default function ResumeManagement() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', html: '', css: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/resume/resumes`);
      
      let templatesData = [];
      if (Array.isArray(response.data)) {
        templatesData = response.data;
      } else if (response.data?.templates) {
        templatesData = response.data.templates;
      } else if (response.data?.data) {
        templatesData = response.data.data;
      }
      
      setTemplates(templatesData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        await axios.put(`${BACKEND_URL}/resume/admin/resumes/${editingId}`, formData);
        alert('Template updated successfully!');
      } else {
        await axios.post(`${BACKEND_URL}/resume/admin/resumes`, formData);
        alert('Template created successfully!');
      }

      await fetchTemplates();
      setShowForm(false);
      setFormData({ name: '', html: '', css: '' });
      setEditingId(null);
    } catch (err) {
      console.error('Submit error:', err);
      setError(editingId ? 'Failed to update template' : 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    try {
      console.log('Editing template:', template);
      
      // Safely extract data
      const name = template?.name || '';
      const html = template?.html || '';
      const css = template?.css || '';
      const id = template?.resumeId || template?._id || '';
      
      console.log('Form data:', { name, html, css, id });
      
      // Update state
      setFormData({ name, html, css });
      setEditingId(id);
      setShowForm(true);
      setError(null);
      
      // Scroll to top to see the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Edit error:', err);
      alert('Error opening edit form: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${BACKEND_URL}/resume/admin/resumes/${id}`);
      alert('Template deleted successfully!');
      await fetchTemplates();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', html: '', css: '' });
    setError(null);
  };

  const openAddForm = () => {
    setShowForm(true);
    setEditingId(null);
    setFormData({ name: '', html: '', css: '' });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Safe rendering - wrap everything in try-catch
  try {
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0, marginBottom: '5px' }}>
              📄 Resume Templates
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Total Templates: {templates.length}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={openAddForm}
              style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ➕ Add Template
            </button>
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
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            padding: '15px', 
            background: '#fee', 
            color: '#c00', 
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #fcc'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '25px' }}>
              {editingId ? '✏️ Edit Template' : '➕ Add New Template'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Modern Resume"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  HTML Code *
                </label>
                <textarea
                  value={formData.html}
                  onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                  required
                  placeholder="<div>Your HTML here...</div>"
                  rows="10"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  CSS Code *
                </label>
                <textarea
                  value={formData.css}
                  onChange={(e) => setFormData({ ...formData, css: e.target.value })}
                  required
                  placeholder=".class { color: blue; }"
                  rows="10"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
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
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  {loading ? 'Saving...' : (editingId ? '💾 Update' : '✅ Create')}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && !showForm && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            fontSize: '1.5rem',
            background: 'white',
            borderRadius: '10px'
          }}>
            ⏳ Loading templates...
          </div>
        )}

        {/* Templates Grid */}
        {!loading && templates.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '20px' 
          }}>
            {templates.map((template, index) => {
              const templateId = template?.resumeId || template?._id || index;
              const templateName = template?.name || 'Untitled Template';
              
              return (
                <div 
                  key={templateId}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <div style={{ 
                    textAlign: 'center', 
                    fontSize: '4rem', 
                    marginBottom: '15px',
                    color: '#007bff'
                  }}>
                    📄
                  </div>
                  <div>
                    <h3 style={{ 
                      margin: '0 0 10px 0', 
                      fontSize: '1.2rem',
                      color: '#333'
                    }}>
                      {templateName}
                    </h3>
                    <p style={{ 
                      margin: '0 0 20px 0', 
                      color: '#666',
                      fontSize: '0.9rem'
                    }}>
                      ID: {templateId}
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleEdit(template)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.95rem'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(templateId)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.95rem'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && templates.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 20px',
            background: 'white',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '5rem', marginBottom: '20px' }}>📝</div>
            <h3 style={{ marginBottom: '10px', fontSize: '1.5rem' }}>No Templates Yet</h3>
            <p style={{ color: '#666', fontSize: '1rem' }}>
              Click "Add Template" to create your first resume template
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Render error:', error);
    return (
      <div style={{ padding: '20px' }}>
        <h1>Error</h1>
        <p>Something went wrong: {error.message}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }
}