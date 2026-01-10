import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

// Logo image from public folder (handles spaces and special characters better)
const logoImage = '/dapoise 1 (7).png';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        padding: '1rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem 2.5rem',
          borderRadius: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img
            src="/WhatsApp_Image_2026-01-09_at_10.45.44_PM-removebg-preview.png"
            alt="Store Logo"
            style={{
              width: 'auto',
              height: '60px',
              marginBottom: '0.5rem',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 0.5rem',
            }}
          />
          <p
            style={{
              color: '#1f2937',
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '0.25rem',
              margin: '0 0 0.25rem',
            }}
          >
            Store login
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '0.875rem 1rem',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: '0.75rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                fontSize: '0.875rem',
                color: '#374151',
              }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                transition: 'all 0.2s',
                background: '#fff',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#dc2626';
                e.target.style.outline = 'none';
                e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Enter your username"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                fontSize: '0.875rem',
                color: '#374151',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                transition: 'all 0.2s',
                background: '#fff',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#dc2626';
                e.target.style.outline = 'none';
                e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: loading ? '#9ca3af' : '#dc2626',
              color: 'white',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              border: 'none',
              boxShadow: loading ? 'none' : '0 4px 6px -1px rgba(220, 38, 38, 0.3), 0 2px 4px -1px rgba(220, 38, 38, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#b91c1c';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(220, 38, 38, 0.4), 0 4px 6px -1px rgba(220, 38, 38, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#dc2626';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.3), 0 2px 4px -1px rgba(220, 38, 38, 0.2)';
              }
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#6b7280',
          }}
        >
          <p style={{ marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.8125rem' }}>Demo Credentials</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <p style={{ margin: 0 }}>
            <strong>Admin:</strong> admin / password123
          </p>
            <p style={{ margin: 0 }}>
            <strong>Manager:</strong> manager / password123
          </p>
            <p style={{ margin: 0 }}>
            <strong>Sales Rep:</strong> sales1 / password123
          </p>
            <p style={{ margin: 0 }}>
            <strong>Accountant:</strong> accountant / password123
          </p>
          </div>
        </div>
      </div>

      {/* Powered By section - Footer at bottom of page */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.01rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.2rem',
        }}
      >
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: '500',
            color: '#9ca3af',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Powered By
        </p>
        <img
          src={logoImage}
          alt="POS System Logo"
          style={{
            width: '120px',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;

