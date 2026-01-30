import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService, User } from '../services/authService';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Users as UsersIcon,
  LogOut,
  Settings as SettingsIcon,
  Truck,
  Percent,
  Bell,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const DashboardLayout = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  if (user?.role === 'admin' || user?.role === 'manager') {
    menuItems.push({ path: '/vendors', icon: Truck, label: 'Vendors' });
    menuItems.push({ path: '/discount-requests', icon: Percent, label: 'Discount Requests' });
    menuItems.push({ path: '/inventory-alerts', icon: Bell, label: 'Inventory Alerts' });
  }

  if (user?.role === 'admin') {
    menuItems.push({ path: '/users', icon: UsersIcon, label: 'Users' });
    menuItems.push({ path: '/settings', icon: SettingsIcon, label: 'Settings' });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
          position: 'fixed',
          height: '100vh',
          zIndex: 1000,
        }}
      >
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
            <img
              src="/WhatsApp_Image_2026-01-09_at_10.45.44_PM-removebg-preview.png"
              alt="POS System Logo"
              style={{
                width: 'auto',
                height: '50px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          <nav>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    borderRadius: '0.5rem',
                    background: active ? '#dc2626' : 'transparent',
                    color: active ? 'white' : 'var(--text)',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--background)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: '250px' }}>
        {/* Top Bar */}
        <header
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600' }}>{user?.full_name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {user?.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'var(--error)',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

