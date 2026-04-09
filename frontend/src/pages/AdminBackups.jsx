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
  LayoutGrid,
  X,
  File
} from 'lucide-react';
import api from '../utils/api';
import '../styles/admin.css';

const JobDetailsModal = ({ job, onClose }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data } = await api.get(`/admin/backups/${job.id}/files`);
        setFiles(data);
      } catch (err) {
        console.error('Failed to fetch job files');
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [job.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
       <div className="card" style={{ width: '600px', maxHeight: '80vh', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Files in JOB-{job.id}</h2>
             <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
             {loading ? <div style={{ textAlign: 'center', padding: '1rem' }}><Clock className="spin" size={24} /></div> : (
               <table className="id-table">
                  <thead>
                    <tr>
                      <th>FILE NAME</th>
                      <th>SIZE</th>
                      <th>ORIGINAL PATH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map(f => (
                       <tr key={f.id}>
                          <td style={{ fontSize: '0.8rem' }}>{f.file_name}</td>
                          <td>{(f.file_size / 1024).toFixed(1)} KB</td>
                          <td style={{ fontSize: '0.7rem', color: '#666' }} title={f.original_path}>{f.original_path.slice(0, 30)}...</td>
                       </tr>
                    ))}
                    {files.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No files recorded for this job.</td></tr>}
                  </tbody>
               </table>
             )}
          </div>
       </div>
    </div>
  );
};

const AdminBackups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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
          <button className="btn btn-primary"><RotateCcw size={18} /> Restore Files</button>
        </div>
      </div>

      <div className="main-content">
        <div className="table-container">
          <div className="table-header">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>System-wide Backup Operations</h3>
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
                      <span onClick={() => { setSelectedJob(job); setShowDetails(true); }}>DETAILS</span>
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

      {showDetails && (
        <JobDetailsModal 
          job={selectedJob} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </div>
  );
};

export default AdminBackups;
