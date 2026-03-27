
import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Database, 
  Globe, 
  Mail, 
  ShieldCheck, 
  Smartphone,
  Server,
  Key
} from 'lucide-react';
import '../styles/admin.css';

const AdminSettings = () => {
  const [config, setConfig] = useState({
    siteName: 'ID-TRAUM VPS Cloud Backup',
    adminEmail: 'admin@traumhosting.net',
    backupFrequency: 'DAILY',
    maxDevicesPerUser: 10,
    retentionDays: 30,
    maintenanceMode: false
  });

  const handleSave = () => {
    alert('System configuration updated successfully');
  };

  return (
    <div className="main-wrapper">
      <div className="top-bar">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Console Configuration</h1>
        <button className="btn btn-primary" onClick={handleSave}><Save size={18} /> Update Server</button>
      </div>

      <div className="main-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="#0072bc" /> Backup Storage Nodes (VPS)
            </h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#f8f9fa', padding: '1rem', borderRadius: '4px' }}>
               <input className="search-input" placeholder="VPS Label" id="vps-name" style={{ flex: 1, paddingLeft: '1rem' }} />
               <input className="search-input" placeholder="IP Address" id="vps-ip" style={{ flex: 1, paddingLeft: '1rem' }} />
               <input className="search-input" placeholder="User" id="vps-user" style={{ width: '80px', paddingLeft: '1rem' }} defaultValue="root" />
               <input className="search-input" type="password" placeholder="Password" id="vps-pass" style={{ flex: 1, paddingLeft: '1rem' }} />
               <button className="btn btn-primary" onClick={async () => {
                  const name = document.getElementById('vps-name').value;
                  const ip = document.getElementById('vps-ip').value;
                  const user = document.getElementById('vps-user').value;
                  const pass = document.getElementById('vps-pass').value;
                  if(!name || !ip || !pass) return alert('Fill all details');
                  try {
                    await api.post('/admin/vps', { vps_name: name, ip_address: ip, username: user, password: pass, total_storage: 500000000000 });
                    alert('VPS Added Successfully');
                    window.location.reload();
                  } catch(e) { alert('Error adding VPS'); }
               }}>+ Add VPS</button>
            </div>
            
            <div className="table-container" style={{ margin: 0, border: '1px solid #eee' }}>
               <table className="id-table">
                  <thead>
                    <tr>
                      <th>VPS NODE</th>
                      <th>IP ADDRESS</th>
                      <th>STORAGE</th>
                      <th>STATUS</th>
                      <th>HEALTH</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Main Backup Server</td>
                      <td>138.252.200.180</td>
                      <td>
                        <div style={{ fontSize: '0.75rem' }}>1.2 TB / 5 TB</div>
                        <div className="progress-bar" style={{ height: '4px' }}><div className="progress-fill" style={{ width: '24%' }}></div></div>
                      </td>
                      <td><span className="status-badge status-online">ACTIVE</span></td>
                      <td>100%</td>
                    </tr>
                  </tbody>
               </table>
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="#0072bc" /> General Settings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Instance Brand Name</label>
                <input 
                  type="text" 
                  className="search-input" 
                  value={config.siteName} 
                  onChange={e => setConfig({...config, siteName: e.target.value})}
                  style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.4rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>System Contact Email</label>
                <input 
                  type="email" 
                  className="search-input" 
                  value={config.adminEmail} 
                  onChange={e => setConfig({...config, adminEmail: e.target.value})}
                  style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.4rem' }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#28a745" /> Storage Policies
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Retention Period (Days)</label>
                <input 
                  type="number" 
                  className="search-input" 
                  value={config.retentionDays} 
                  onChange={e => setConfig({...config, retentionDays: parseInt(e.target.value)})}
                  style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.4rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Max Devices per Account</label>
                <input 
                  type="number" 
                  className="search-input" 
                  value={config.maxDevicesPerUser} 
                  onChange={e => setConfig({...config, maxDevicesPerUser: parseInt(e.target.value)})}
                  style={{ width: '100%', paddingLeft: '1rem', marginTop: '0.4rem' }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#ffc107" /> Security & 2FA
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Global 2FA Enforcement</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>Require all admins to use biometric authentication</div>
                </div>
                <input type="checkbox" style={{ width: '18px', height: '18px' }} defaultChecked />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Audit Logging</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>Record every API transaction in the database</div>
                </div>
                <input type="checkbox" style={{ width: '18px', height: '18px' }} defaultChecked />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="#dc3545" /> Maintenance Mode
            </h3>
            <div style={{ background: '#fff5f5', border: '1px dashed #feb2b2', padding: '1rem', borderRadius: '4px' }}>
                 <p style={{ fontSize: '0.8rem', color: '#c53030', marginBottom: '1rem' }}>
                    <b>DANGER:</b> Enabling maintenance mode will block all backup agents and end-user access immediately.
                 </p>
                 <button className="btn btn-primary" style={{ background: '#c53030', width: '100%', justifyContent: 'center' }}>
                    ACTIVATE MAINTENANCE
                 </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
