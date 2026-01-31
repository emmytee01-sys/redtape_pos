import { useEffect, useState } from 'react';
import { reportService, DashboardStats } from '../services/reportService';
import { orderService, Order } from '../services/orderService';
import { discountRequestService } from '../services/discountRequestService';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Package, Percent } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isSalesRep = user?.role === 'sales_rep';
  const isAccountant = user?.role === 'accountant';

  useEffect(() => {
    loadStats();
    if (isSalesRep) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getAll();
      if (Array.isArray(data)) {
        // Only show pending orders for discount requests
        const pendingOrders = data.filter((order) => order.status === 'pending' && order.sales_rep_id === user?.id);
        setOrders(pendingOrders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getDashboardStats();
      setStats(data);
    } catch (error: any) {
      console.error('Failed to load dashboard stats:', error);
      setError('Failed to load dashboard statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
        <h2 style={{ marginBottom: '1rem' }}>Session Expired</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Please log in again to view the dashboard.</p>
        <button onClick={() => navigate('/login')} style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>Go to Login</button>
      </div>
    );
  }

  // Define cards based on roles
  let dashboardCards: any[] = [];

  if (isAccountant || isAdmin || isManager) {
    dashboardCards = [
      {
        title: 'Total Sales Amount',
        value: `₦${Number(stats?.total_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: DollarSign,
        color: '#dc2626',
        isHighlight: true,
        description: 'Total revenue from all paid orders'
      },
      {
        title: 'Today\'s Sales',
        value: `₦${Number(stats?.today_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: TrendingUp,
        color: 'var(--success)',
      },
      {
        title: 'Total Orders',
        value: (stats?.total_orders || 0).toLocaleString(),
        icon: ShoppingCart,
        color: 'var(--primary)',
      }
    ];

    if (isAdmin || isManager) {
      dashboardCards.push({
        title: 'Low Stock Items',
        value: stats?.low_stock_items || 0,
        icon: AlertTriangle,
        color: 'var(--warning)',
      });
    }
  } else if (isSalesRep) {
    dashboardCards = [
      {
        title: 'Your Total Sales',
        value: `₦${Number(stats?.total_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: DollarSign,
        color: 'var(--primary)',
      },
      {
        title: 'Your Today\'s Sales',
        value: `₦${Number(stats?.today_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: TrendingUp,
        color: 'var(--success)',
      },
      {
        title: 'Your Orders',
        value: stats?.total_orders || 0,
        icon: ShoppingCart,
        color: 'var(--accent)',
      },
      {
        title: 'Low Stock Items',
        value: stats?.low_stock_items || 0,
        icon: AlertTriangle,
        color: 'var(--warning)',
      }
    ];
  } else {
    // Default cards for any other role
    dashboardCards = [
      {
        title: 'Total Sales',
        value: `₦${Number(stats?.total_sales || 0).toFixed(2)}`,
        icon: DollarSign,
        color: 'var(--primary)',
      },
      {
        title: 'Total Orders',
        value: stats?.total_orders || 0,
        icon: ShoppingCart,
        color: 'var(--accent)',
      }
    ];
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.025em' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Welcome back, <span style={{ fontWeight: '600', color: 'var(--text)' }}>{user.full_name}</span>. Here's what's happening today.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {error && <span style={{ color: 'var(--error)', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>{error}</span>}
          <button
            onClick={loadStats}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        {dashboardCards.map((card: any) => {
          const Icon = card.icon;
          const isHighlight = card.isHighlight;
          return (
            <div
              key={card.title}
              style={{
                background: isHighlight ? `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)` : 'var(--surface)',
                padding: '1.75rem',
                borderRadius: '1rem',
                boxShadow: isHighlight ? `0 10px 15px -3px ${card.color}20` : 'var(--shadow)',
                border: isHighlight ? `2px solid ${card.color}` : '1px solid var(--border)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {card.title}
                  </p>
                  <p style={{ fontSize: isHighlight ? '2.5rem' : '2.25rem', fontWeight: '800', color: isHighlight ? card.color : 'var(--text)', lineHeight: '1' }}>
                    {card.value}
                  </p>
                  {card.description && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                      {card.description}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '1rem',
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={28} color={card.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isSalesRep && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text)' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <button
              onClick={() => navigate('/products')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '2rem',
                background: '#dc2626',
                color: 'white',
                borderRadius: '1rem',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#b91c1c';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#dc2626';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
                <Package size={32} />
              </div>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', display: 'block' }}>Pick Items</span>
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Create a new customer order</span>
              </div>
            </button>

            <button
              onClick={() => setShowDiscountModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '2rem',
                background: '#2563eb',
                color: 'white',
                borderRadius: '1rem',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
                <Percent size={32} />
              </div>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', display: 'block' }}>Discount Request</span>
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Request price reduction</span>
              </div>
            </button>
          </div>
        </section>
      )}

      {(isAdmin || isManager || isAccountant) && (
        <section
          style={{
            background: 'var(--surface)',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text)' }}>
            System Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '600px' }}>
            You have access to all system modules. Use the sidebar to manage products, view detailed reports, and monitor user activity.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/reports')} style={{ padding: '0.75rem 1.5rem', background: 'var(--background)', borderRadius: '0.5rem', fontWeight: '600', border: '1px solid var(--border)' }}>View Reports</button>
            {(isAdmin || isManager) && <button onClick={() => navigate('/products')} style={{ padding: '0.75rem 1.5rem', background: 'var(--background)', borderRadius: '0.5rem', fontWeight: '600', border: '1px solid var(--border)' }}>Inventory Management</button>}
          </div>
        </section>
      )}

      {/* Request Discount Modal */}
      {showDiscountModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowDiscountModal(false);
            setSelectedOrder(null);
            setDiscountAmount('');
            setDiscountReason('');
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '2.5rem',
              borderRadius: '1.25rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text)' }}>Request Discount</h2>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--background)', borderRadius: '0.75rem' }}>
                <p style={{ fontWeight: '600' }}>No pending orders found.</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>You must have a pending order to request a discount.</p>
                <button
                  onClick={() => navigate('/products')}
                  style={{ marginTop: '1.5rem', background: 'var(--primary)', color: 'white', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                >
                  Create Order
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text)' }}>
                    Select Order *
                  </label>
                  <select
                    value={selectedOrder?.id || ''}
                    onChange={(e) => {
                      const order = orders.find((o) => o.id === parseInt(e.target.value));
                      setSelectedOrder(order || null);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      background: 'white',
                      appearance: 'none',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <option value="">Select an order to discount</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.order_number} - {order.customer_name || 'Walk-in'} (₦{Number(order.total).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedOrder && (
                  <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--background)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                        Order Summary
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.925rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                        <span style={{ fontWeight: '600' }}>{selectedOrder.customer_name || 'Walk-in Customer'}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Current Total:</span>
                        <span style={{ fontWeight: '600' }}>₦{Number(selectedOrder.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                        Discount Amount (₦) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        placeholder="0.00"
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                        }}
                      />
                      {discountAmount && selectedOrder && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--success)', marginTop: '0.75rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between' }}>
                          <span>New Total:</span>
                          <span>₦{(Number(selectedOrder.total) - Number(discountAmount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                        Reason for Discount *
                      </label>
                      <textarea
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        rows={4}
                        placeholder="Provide detailed justification for this discount request..."
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                          resize: 'vertical',
                          minHeight: '100px'
                        }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => {
                      setShowDiscountModal(false);
                      setSelectedOrder(null);
                      setDiscountAmount('');
                      setDiscountReason('');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '0.75rem',
                      fontWeight: '600',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedOrder || !discountAmount || !discountReason) {
                        alert('Please fill in all fields');
                        return;
                      }

                      const discountValue = Number(discountAmount);
                      if (discountValue <= 0 || discountValue > selectedOrder.total) {
                        alert('Discount amount must be greater than 0 and less than order total');
                        return;
                      }

                      try {
                        await discountRequestService.create({
                          order_id: selectedOrder.id,
                          discount_amount: discountValue,
                          reason: discountReason,
                        });
                        alert(`Discount request submitted for ${selectedOrder.order_number}.\nThis will be reviewed by an administrator.`);
                        setShowDiscountModal(false);
                        setSelectedOrder(null);
                        setDiscountAmount('');
                        setDiscountReason('');
                        loadOrders();
                      } catch (error: any) {
                        alert(error.response?.data?.error || 'Failed to submit discount request');
                      }
                    }}
                    disabled={!selectedOrder || !discountAmount || !discountReason}
                    style={{
                      flex: 2,
                      padding: '0.875rem',
                      background: !selectedOrder || !discountAmount || !discountReason ? '#94a3b8' : '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      cursor: !selectedOrder || !discountAmount || !discountReason ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      boxShadow: selectedOrder && discountAmount && discountReason ? '0 4px 6px -1px rgba(37, 99, 235, 0.4)' : 'none',
                    }}
                  >
                    Submit Request
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};


export default Dashboard;

