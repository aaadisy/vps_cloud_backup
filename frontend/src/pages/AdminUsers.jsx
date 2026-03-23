
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Lock, 
  Download,
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import api from '../utils/api';
import '../styles/admin.css';

const UserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState(user || { name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        // Just for demo, you'd have an update endpoint
        await api.post('/admin/disable-user', { user_id: user.id, status: formData.status });
      } else {
        await api.post('/admin/create-user', formData);
      }
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
            <input 
              className="search-input" 
              style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.25rem' }}
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
            <input 
              className="search-input" 
              style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.25rem' }}
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          {!user && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Initial Password</label>
              <input 
                className="search-input" 
                style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.25rem' }}
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Role</label>
            <select 
              className="search-input" 
              style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.25rem' }}
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="user">Standard User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Processing...' : user ? 'Update User' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/user/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      await api.post('/admin/disable-user', { user_id: user.id, status: newStatus });
      fetchUsers();
    } catch (err) {
      alert('Status update failed');
    }
  };

  return (
    <div className="main-wrapper">
      <div className="top-bar">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>User Management</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline"><Download size={18} /> Export</button>
          <button className="btn btn-primary" onClick={() => { setSelectedUser(null); setShowModal(true); }}>
            <UserPlus size={18} /> Add User
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="table-container">
          <div className="table-header">
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input type="text" placeholder="Search accounts..." className="search-input" />
            </div>
          </div>

          <table className="id-table">
            <thead>
              <tr>
                <th>USER / EMAIL</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>USAGE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Loading...</td></tr>
              ) : users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0072bc' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{user.email}</div>
                  </td>
                  <td><span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{user.role}</span></td>
                  <td>
                    <span className={`status-badge status-${user.status === 'active' ? 'online' : 'offline'}`} 
                          style={{ cursor: 'pointer' }} 
                          onClick={() => toggleStatus(user)}
                          title="Click to toggle"
                    >
                      <CheckCircle2 size={14} /> {user.status?.toUpperCase()}
                    </span>
                  </td>
                  <td>--</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setSelectedUser(user); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(user.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <UserModal 
          user={selectedUser} 
          onClose={() => setShowModal(false)} 
          onSave={() => { setShowModal(false); fetchUsers(); }} 
        />
      )}
    </div>
  );
};

export default AdminUsers;
