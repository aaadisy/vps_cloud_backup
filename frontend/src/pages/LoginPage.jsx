
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, LogIn, Eye, EyeOff, Server, HelpCircle, AlertTriangle } from 'lucide-react';
import '../styles/admin.css';
import api from '../utils/api';

const LoginPage = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      // Store user data and token
      localStorage.setItem('traum_admin_user', JSON.stringify(data));
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      background: '#f4f7f9',
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Server size={32} color="#0072bc" fill="#f0f7ff" />
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0072bc', letterSpacing: '-1px' }}>ID-TRAUM</span>
          </div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#333' }}>Sign in to Admin Console</h1>
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.5rem' }}>Manage your cloud infrastructure and backups</p>
        </div>

        {error && (
          <div style={{ 
            background: '#fef1f1', 
            border: '1px solid #fecaca', 
            color: '#dc2626', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            fontSize: '0.8rem', 
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input 
                type="email" 
                placeholder="admin@example.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  background: '#ffffff', 
                  border: '1px solid #e1e8ed', 
                  borderRadius: '4px', 
                  padding: '0.75rem 1rem 0.75rem 2.5rem', 
                  color: '#333',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>Secure Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="********" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  background: '#ffffff', 
                  border: '1px solid #e1e8ed', 
                  borderRadius: '4px', 
                  padding: '0.75rem 3rem 0.75rem 2.5rem', 
                  color: '#333',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#999' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%',
              padding: '0.85rem', 
              fontSize: '1rem', 
              borderRadius: '4px',
              marginTop: '1.5rem',
              justifyContent: 'center',
              background: loading ? '#0072bc80' : '#0072bc'
            }}
          >
            {loading ? (
              <div className="spin-slow" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
            ) : (
              'Sign In to Admin Portal'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
