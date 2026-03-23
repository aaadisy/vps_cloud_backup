
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
