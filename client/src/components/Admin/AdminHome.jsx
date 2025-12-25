// AdminHome.jsx
import React, { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "../../CSS/Admin.css";

const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

const AdminHome = () => {
  /* ---------- State ---------- */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // MongoDB _id
  const [formData, setFormData] = useState({
    id: "",               // <-- matches `id` in DB
    userDesignation: "student",
    image: null,          // file object
  });

  /* ---------- Init ---------- */
  useEffect(() => {
    fetchUsers();
    AOS.init({ duration: 800, once: true });
  }, []);

  /* ---------- API Calls ---------- */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/user/fetch-users`);
      const data = await res.json();
      if (data.success) setUsers(data.users);
      else setError(data.error ?? "Failed to load users");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrEdit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingId;
    const url = isEdit
      ? `${BACKEND_URL}/user/edit-user/${editingId}`
      : `${BACKEND_URL}/user/userdata`;
    const method = isEdit ? "PUT" : "POST";

    const payload = new FormData();
    payload.append("id", formData.id);
    payload.append("userDesignation", formData.userDesignation);
    if (formData.image) payload.append("image", formData.image);

    try {
      const res = await fetch(url, { method, body: payload });
      const data = await res.json();

      if (data.success) {
        resetForm();
        fetchUsers();
      } else {
        setError(data.error ?? "Operation failed");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (mongoId) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      const res = await fetch(`${BACKEND_URL}/user/delete-user/${mongoId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) fetchUsers();
      else setError(data.error ?? "Delete failed");
    } catch (err) {
      setError(err.message);
    }
  };

  /* ---------- Handlers ---------- */
  const startEdit = (user) => {
    setFormData({
      id: user.id,
      userDesignation: user.userDesignation,
      image: null,
    });
    setEditingId(user._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ id: "", userDesignation: "student", image: null });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0] ?? null;
    setFormData((prev) => ({ ...prev, image: file }));
  };

  /* ---------- Render ---------- */
  if (loading) return <div className="loading" data-aos="zoom-in">Loading…</div>;
  if (error) return <div className="error" data-aos="fade-up">Error: {error}</div>;

  return (
    <div className="container" data-aos="fade-in">
      <h1 className="title" data-aos="zoom-in">
        Admin Dashboard
      </h1>

      <button
        className="btn-add"
        onClick={() => {
          if (showForm) resetForm();
          else setShowForm(true);
        }}
        data-aos="fade-up"
      >
        {showForm ? "Cancel" : "Add User"}
      </button>

      {/* ---------- Form ---------- */}
      {showForm && (
        <form className="form" onSubmit={handleCreateOrEdit} data-aos="zoom-in">
          <input
            type="text"
            name="id"
            placeholder="User ID"
            value={formData.id}
            onChange={handleInput}
            required
          />

          <select
            name="userDesignation"
            value={formData.userDesignation}
            onChange={handleInput}
            required
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>

          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
          />

          <button type="submit" className="btn-submit">
            {editingId ? "Update User" : "Create User"}
          </button>
        </form>
      )}

      {/* ---------- Table ---------- */}
      <div className="table-container" data-aos="fade-up">
        <table className="table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Image</th>
              <th>Designation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user._id} data-aos="fade-up" data-aos-delay={idx * 100}>
                <td>{user.id}</td>
                <td>
                  <img
                    src={user.imageurl}
                    alt="User"
                    className="user-image"
                    onError={(e) => (e.target.src = "/fallback-avatar.png")}
                  />
                </td>
                <td>{user.userDesignation}</td>
                <td>
                  <button className="btn-edit" onClick={() => startEdit(user)}>
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(user._id)}
                  >
                    Delete
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

export default AdminHome;