
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminBackups from './pages/AdminBackups';
import AdminDevices from './pages/AdminDevices';
import AdminActivity from './pages/AdminActivity';
import AdminSettings from './pages/AdminSettings';
import LoginPage from './pages/LoginPage';
import './styles/admin.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('traum_admin_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('traum_admin_user');
    setUser(null);
  };

  if (loading) return null; // Or a splash screen

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <Router>
      <div className="admin-container">
        <AdminSidebar onLogout={handleLogout} user={user} />
        <main className="main-wrapper">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/backups" element={<AdminBackups />} />
            <Route path="/admin/devices" element={<AdminDevices />} />
            <Route path="/admin/activity" element={<AdminActivity />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
