import React, { useState, useEffect } from 'react';

import { 
  Server, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  HardDrive,
  Clock,
  ExternalLink,
  ShieldCheck,
  Play,
  X,
  Settings,
  Calendar
} from 'lucide-react';
import api from '../utils/api';
import '../styles/admin.css';

const FileExplorerModal = ({ device, onClose }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data } = await api.get(`/admin/device/${device.id}/files`);
        setFiles(data);
      } catch (err) {
        console.error('Failed to fetch files');
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [device.id]);

  const triggerRestore = async (file) => {
    const targetDir = window.prompt("Enter destination path on client PC:", "C:\\Restored_Files");
    if (!targetDir) return;
    try {
      await api.post(`/admin/device/${device.id}/restore`, { 
        file_id: file.id,
        target_dir: targetDir
      });
      alert("Restore command queued to agent!");
    } catch (e) { alert("Restore failed"); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
       <div className="card" style={{ width: '80%', maxWidth: '800px', height: '600px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Restore Explorer: {device.device_name}</h2>
             <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
             {loading ? <p>Scanning cloud storage...</p> : (
               <table className="id-table">
                  <thead>
                    <tr>
                      <th>FILE NAME</th>
                      <th>UPLOADED</th>
                      <th>SIZE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map(f => (
                       <tr key={f.id}>
                          <td>{f.file_name || f.original_path.split('\\').pop()}</td>
                          <td>{new Date(f.createdAt).toLocaleString()}</td>
                          <td>{(f.file_size / 1024).toFixed(1)} KB</td>
                          <td>
                             <button className="btn btn-primary btn-sm" onClick={() => triggerRestore(f)}>RESTORE</button>
                          </td>
                       </tr>
                    ))}
                    {files.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No backed up files found for this device.</td></tr>}
                  </tbody>
               </table>
             )}
          </div>
       </div>
    </div>
  );
}

const DeviceConfigModal = ({ device, onClose, onSave }) => {
  const [formData, setFormData] = useState({ 
    device_name: device.device_name, 
    backup_paths: device.backup_paths || 'C:\\Users\\'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/device/${device.id}`, formData);
      onSave();
    } catch (err) {
      alert('Config update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '450px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Real-time Sync Config</h2>
            <p style={{ fontSize: '0.75rem', color: '#666' }}>Remote control for {device.device_uuid}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Friendly Name</label>
            <input 
              className="search-input" 
              style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.4rem' }}
              value={formData.device_name}
              onChange={e => setFormData({...formData, device_name: e.target.value})}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
               <HardDrive size={14} /> Active Protection Paths (Auto-Sync)
            </label>
            <textarea 
              className="search-input" 
              rows="5"
              style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.4rem', paddingTop: '0.5rem', resize: 'vertical' }}
              value={formData.backup_paths}
              onChange={e => setFormData({...formData, backup_paths: e.target.value})}
              placeholder='Add paths to watch in real-time...'
            />
            <p style={{ fontSize: '0.65rem', color: '#999', marginTop: '0.3rem' }}>* Files in these folders will sync automatically as they change.</p>
          </div>
          
          <button className="btn btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Propagating...' : 'Update Sync Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
};

const DeviceModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({ device_name: '', device_uuid: '', os_type: 'UBUNTU 22.04', user_id: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/users').then(res => setUsers(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Logic for adding device through backend
      await api.post('/devices/register', formData);
      onSave();
    } catch (err) {
      alert('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '450px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.115rem', fontWeight: 700 }}>Register Management Node</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Device Display Name</label>
            <input 
              className="search-input" 
              style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.25rem' }}
              value={formData.device_name}
              onChange={e => setFormData({...formData, device_name: e.target.value})}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Provision UUID (Unique Identifier)</label>
            <input 
              className="search-input" 
              style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.25rem' }}
              value={formData.device_uuid}
              onChange={e => setFormData({...formData, device_uuid: e.target.value})}
              placeholder="e.g. 550e8400-e29b-41d4-a716..."
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Operating System</label>
                <select 
                  className="search-input" 
                  style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.25rem' }}
                  value={formData.os_type}
                  onChange={e => setFormData({...formData, os_type: e.target.value})}
                >
                   <option value="UBUNTU 22.04">Ubuntu 22.04</option>
                   <option value="DEBIAN 11">Debian 11</option>
                   <option value="CENTOS 7">CentOS 7</option>
                   <option value="WINDOWS SERVER">Windows Server</option>
                </select>
             </div>
             <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Assign to Owner</label>
                <select 
                  className="search-input" 
                  style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.25rem' }}
                  value={formData.user_id}
                  onChange={e => setFormData({...formData, user_id: e.target.value})}
                  required
                >
                   <option value="">Select User...</option>
                   {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
             </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Provisioning...' : 'Add Device Record'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showExplorerModal, setShowExplorerModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/devices');
      setDevices(data);
    } catch (err) {
      console.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this device and stop tracking its backups?')) return;
    try {
      await api.delete(`/admin/device/${id}`);
      fetchDevices();
    } catch (err) {
      alert('Failed to remove device');
    }
  };

  const sendCommand = async (device, command) => {
    try {
      const { data } = await api.post(`/admin/device/${device.id}/command`, { command });
      alert(data.message);
      fetchDevices();
    } catch (err) {
      alert('Command failed. Check network.');
    }
  };

  return (
    <div className="main-wrapper">
      <div className="top-bar">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Registered Devices (VPS)</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline"><ShieldCheck size={18} /> Health Check</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={18} /> Add New Device</button>
        </div>
      </div>

      <div className="main-content">
        <div className="table-container">
          <div className="table-header">
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input type="text" placeholder="Search by name or UUID..." className="search-input" />
            </div>
          </div>

          <table className="id-table">
            <thead>
              <tr>
                <th>DEVICE NAME / UUID</th>
                <th>OWNER</th>
                <th>OS TYPE</th>
                <th>STATUS</th>
                <th>LAST SEEN</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Loading devices...</td></tr>
              ) : devices.map((dev) => (
                <tr key={dev.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0072bc' }}>{dev.device_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#999', fontFamily: 'monospace' }}>{dev.device_uuid}</div>
                  </td>
                  <td>{dev.User?.name || 'Unknown'}</td>
                  <td>
                     <span style={{ fontSize: '0.75rem', fontWeight: 500, background: '#f0f7ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {dev.os_type || 'LINUX'}
                     </span>
                  </td>
                  <td>
                    {new Date() - new Date(dev.last_seen) < 60000 ? (
                      <span className="status-badge status-online">
                        <CheckCircle2 size={14} /> ONLINE
                      </span>
                    ) : (
                      <span className="status-badge status-offline">
                        <Clock size={14} /> OFFLINE
                      </span>
                    )}
                    <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px' }}>
                       State: <span style={{ fontWeight: 700 }}>{dev.last_backup_status || 'IDLE'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(dev.last_seen).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setSelectedDevice(dev); setShowExplorerModal(true); }} title="Restore Explorer" className="btn btn-outline btn-sm" style={{ padding: '0.2rem 0.6rem', gap: '4px' }}><ExternalLink size={14} /> EXPLORE</button>
                      
                      <button onClick={() => sendCommand(dev, 'START')} title="Run Manual Sync" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#28a745' }}><Play size={16} fill="#28a745" /></button>
                      
                      {dev.last_backup_status === 'BUSY' ? (
                        <button onClick={() => sendCommand(dev, 'PAUSE')} title="Pause" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffc107' }}>PAUSE</button>
                      ) : dev.last_backup_status === 'PAUSED' ? (
                        <button onClick={() => sendCommand(dev, 'RESUME')} title="Resume" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#17a2b8' }}>RESUME</button>
                      ) : null}

                      <button onClick={() => { setSelectedDevice(dev); setShowConfigModal(true); }} title="Remote Config" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0072bc' }}><Settings size={16} /></button>
                      <button onClick={() => handleDelete(dev.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && devices.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>No devices registered. Install the backup agent on your VPS to register.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <DeviceModal 
          onClose={() => setShowAddModal(false)} 
          onSave={() => { setShowAddModal(false); fetchDevices(); }} 
        />
      )}

      {showConfigModal && (
        <DeviceConfigModal 
          device={selectedDevice}
          onClose={() => setShowConfigModal(false)} 
          onSave={() => { setShowConfigModal(false); fetchDevices(); }} 
        />
      )}

      {showExplorerModal && (
        <FileExplorerModal 
          device={selectedDevice}
          onClose={() => setShowExplorerModal(false)}
        />
      )}
    </div>
  );
};

export default AdminDevices;
