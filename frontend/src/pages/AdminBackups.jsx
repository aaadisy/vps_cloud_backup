
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Calendar, 
  HardDrive, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText,
  RotateCcw,
  Zap,
  LayoutGrid
} from 'lucide-react';
import api from '../utils/api';
import '../styles/admin.css';

const AdminBackups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBackups = async () => {
      try {
        const { data } = await api.get('/admin/backups');
        setBackups(data);
      } catch (err) {
        console.error('Failed to load backup logs');
      } finally {
        setLoading(false);
      }
    };
    fetchBackups();
  }, []);

  const triggerRestore = async (job) => {
    if (!window.confirm(`Initiate a restore for JOB-${job.id}?`)) return;
    try {
      const { data } = await api.post(`/admin/trigger-restore/${job.id}`);
      alert(data.message);
    } catch (err) {
      alert('Restore trigger failed');
    }
  };

  return (
    <div className="main-wrapper">
      <div className="top-bar">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Restore / Backup Logs</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline"><Calendar size={18} /> Date Range</button>
          <button className="btn btn-primary"><RotateCcw size={18} /> Restore Files</button>
        </div>
      </div>

      <div className="main-content">
        <div className="table-container">
          <div className="table-header">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>System-wide Backup Operations</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }}><Zap size={14} /> Real-time</button>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }}><LayoutGrid size={14} /></button>
            </div>
          </div>

          <table className="id-table">
            <thead>
              <tr>
                <th>JOB ID</th>
                <th>DEVICE NAME</th>
                <th>USER / OWNER</th>
                <th>SIZE</th>
                <th>STATUS</th>
                <th>COMPLETED</th>
                <th>LOGS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>Fetching backup logs...</td></tr>
              ) : backups.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 700, color: '#0072bc', fontSize: '0.85rem' }}>JOB-{job.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <HardDrive size={14} color="#666" />
                      {job.Device?.device_name || 'Unknown'}
                    </div>
                  </td>
                  <td>{job.User?.name || 'Unknown'}</td>
                  <td>{(job.total_size / (1024**2)).toFixed(2) || 0} MB</td>
                  <td>
                    {job.status === 'completed' ? (
                      <span className="status-badge status-online">
                        <CheckCircle2 size={14} /> Completed
                      </span>
                    ) : job.status === 'failed' ? (
                      <span className="status-badge status-offline">
                        <XCircle size={14} /> Failed
                      </span>
                    ) : (
                      <div className="status-badge status-pending" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> In Progress
                        </div>
                        <div className="progress-bar" style={{ height: '4px', width: '80px' }}>
                          <div className="progress-fill" style={{ width: `${job.progress_percent || 0}%` }}></div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#666' }}>{job.completed_at ? new Date(job.completed_at).toLocaleString() : 'Running...'}</td>
                  <td style={{ color: '#0072bc', fontWeight: 600, fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                      <span onClick={() => alert('Viewing details...')}>DETAILS</span>
                      {job.status === 'completed' && (
                        <span onClick={() => triggerRestore(job)} style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <RotateCcw size={14} /> RESTORE
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && backups.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>No backup jobs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBackups;
