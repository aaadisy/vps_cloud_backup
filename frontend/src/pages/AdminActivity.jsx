
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Trash2,
  Download
} from 'lucide-react';
import api from '../utils/api';
import '../styles/admin.css';

const AdminActivity = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/admin/activity-logs');
        setLogs(data);
      } catch (err) {
        console.error('Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="main-wrapper">
      <div className="top-bar">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>System Audit & Security Logs</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline"><Download size={18} /> Export CSV</button>
          <button className="btn btn-primary" onClick={() => alert('Log rotation scheduled')}>Audit Report</button>
        </div>
      </div>

      <div className="main-content">
        <div className="table-container">
          <div className="table-header">
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input type="text" placeholder="Filter by event or user..." className="search-input" />
            </div>
            <button className="btn btn-outline"><Calendar size={14} /> Filter Dates</button>
          </div>

          <table className="id-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>ACTOR / USER</th>
                <th>EVENT TYPE</th>
                <th>DESCRIPTION</th>
                <th>SEVERITY</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Retrieving security events...</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <User size={14} color="#0072bc" />
                      {log.User?.name || 'SYSTEM'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#333' }}>{log.action}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{log.description}</td>
                  <td>
                    <span className={`status-badge ${log.action.includes('FAIL') || log.action.includes('ERROR') ? 'status-offline' : 'status-online'}`}>
                      {log.action.includes('FAIL') ? <ShieldAlert size={12}/> : <ShieldCheck size={12}/>}
                      {log.action.includes('FAIL') ? 'WARNING' : 'INFO'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>No security events found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminActivity;
