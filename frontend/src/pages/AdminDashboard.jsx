
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Server, 
  Database, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Inbox,
  LogOut
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../utils/api';
import '../styles/admin.css';

const StorageBar = ({ title, usedBytes, totalBytes = 5000000000, color = '#0072bc' }) => {
  const usedTB = (usedBytes / (1024 ** 4)).toFixed(2);
  const totalTB = (totalBytes / (1024 ** 4)).toFixed(2);
  const percent = Math.min((usedBytes / totalBytes) * 100, 100);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 600, color: '#333' }}>{title}</span>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>{percent.toFixed(1)}% Used</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%`, backgroundColor: color }}></div>
      </div>
      <div className="progress-label">
        <span>{usedTB} TB Used</span>
        <span>{totalTB} TB Total</span>
      </div>
    </div>
  );
};

const QuickStat = ({ title, value, icon: Icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
    <div style={{ 
      width: '40px', height: '40px', 
      borderRadius: '4px', background: `${color}15`, 
      display: 'flex', alignItems: 'center', justifyContent: 'center' 
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{value}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    devices: 0,
    backups: 0,
    storage: 0,
    logs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, devices, backups, storage, logs, userStorage] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/devices'),
          api.get('/admin/backups'),
          api.get('/admin/storage-usage'),
          api.get('/admin/activity-logs'),
          api.get('/admin/stats/storage-by-user')
        ]);

        setStats({
          users: users.data.length,
          devices: devices.data.length,
          backups: backups.data.length,
          storage: storage.data.used_bytes,
          total: storage.data.total_bytes,
          logs: logs.data.slice(0, 5),
          userStorage: userStorage.data
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const downloadReport = async () => {
    try {
      const { data } = await api.get('/admin/reports/usage');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'traum_system_report.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Report generation failed');
    }
  };

  return (
    <div className="main-wrapper">
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Overview</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={downloadReport}>Generate Report</button>
        </div>
      </div>

      <div className="main-content">
        <div className="stats-grid">
          <StorageBar title="Primary Storage Usage" usedBytes={stats.storage} totalBytes={stats.total} />
          <StorageBar 
            title="Active Data Growth (24h)" 
            usedBytes={stats.backups * 1024 * 1024} // ~1MB per job metadata etc
            totalBytes={stats.total * 0.01} 
            color="#17a2b8" 
          />
          <StorageBar 
            title="Infrastructure Health" 
            usedBytes={stats.devices * 0.5 * 1024**3} // Estimated device overhead
            totalBytes={stats.total} 
            color="#28a745" 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <QuickStat title="Total Users" value={stats.users} icon={Users} color="#0072bc" />
          <QuickStat title="Active Devices" value={stats.devices} icon={Server} color="#17a2b8" />
          <QuickStat title="Total Backup Jobs" value={stats.backups} icon={Database} color="#28a745" />
          <QuickStat title="System Logs" value={stats.logs.length} icon={Inbox} color="#ffc107" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ minHeight: '350px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>User-wise Storage Allocation</h3>
            <div style={{ width: '100%', height: '250px' }}>
               {/* Simplified User Chart */}
               {stats.userStorage?.map((u, i) => (
                  <div key={i} style={{ marginBottom: '1.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                         <span>{u.name}</span>
                         <span>{(u.total_storage_bytes / (1024**2)).toFixed(1)} MB</span>
                      </div>
                      <div className="progress-bar" style={{ height: '6px' }}>
                        <div className="progress-fill" style={{ width: `${Math.min((u.total_storage_bytes / (stats.storage || 1)) * 100, 100)}%`, backgroundColor: '#0072bc' }}></div>
                      </div>
                  </div>
               ))}
               {!stats.userStorage?.length && <div style={{ textAlign: 'center', color: '#999', paddingTop: '2rem' }}>No user data yet</div>}
            </div>
          </div>

          <div className="card" style={{ minHeight: '350px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Storage Growth Trend</h3>
            <div style={{ width: '100%', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{ name: 'Now', value: stats.storage / (1024**3) }]}>
                  <defs>
                    <linearGradient id="idriveBlueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0072bc" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0072bc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#0072bc" fill="url(#idriveBlueGrad)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Recent System Events</h3>
            <div className="table-container" style={{ margin: 0 }}>
               <table className="id-table">
                  <thead>
                    <tr>
                      <th>TIMESTAMP</th>
                      <th>ACTION</th>
                      <th>DESCRIPTION</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.75rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                        <td style={{ fontWeight: 600 }}>{log.action}</td>
                        <td style={{ color: '#666' }}>{log.description}</td>
                        <td><span className="status-badge status-online">SUCCESS</span></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
