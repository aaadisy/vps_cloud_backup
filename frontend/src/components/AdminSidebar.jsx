
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Server, 
  History, 
  Activity, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import '../styles/admin.css';

const AdminSidebar = ({ onLogout, user }) => {
  const menuItems = [
    { title: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
    { title: 'Users', icon: Users, path: '/admin/users' },
    { title: 'Devices', icon: Server, path: '/admin/devices' },
    { title: 'Restore / Logs', icon: History, path: '/admin/backups' },
    { title: 'Activity Logs', icon: Activity, path: '/admin/activity' },
    { title: 'System Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="sidebar">
      <div className="logo-container">
        <Server size={24} color="#0072bc" fill="#f0f7ff" />
        <span className="logo-text">ID-TRAUM</span>
      </div>

      <nav className="nav-links">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid #e1e8ed', padding: '1rem 0' }}>
        <div style={{ padding: '0 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0072bc15', color: '#0072bc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: '0.7rem', color: '#999' }}>ID: {user?.id}</div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="nav-item" 
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', color: '#dc3545' }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
