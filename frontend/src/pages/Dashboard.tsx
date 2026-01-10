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
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isSalesRep = user?.role === 'sales_rep';

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
      // Only show pending orders for discount requests
      const pendingOrders = data.filter((order) => order.status === 'pending' && order.sales_rep_id === user?.id);
      setOrders(pendingOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await reportService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  const cards = [
    {
      title: 'Total Sales',
      value: `₦${stats?.total_sales.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'var(--primary)',
    },
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'var(--accent)',
    },
    {
      title: 'Today Sales',
      value: `₦${stats?.today_sales.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'var(--success)',
    },
    {
      title: 'Low Stock Items',
      value: stats?.low_stock_items || 0,
      icon: AlertTriangle,
      color: 'var(--warning)',
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Dashboard</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              style={{
                background: 'var(--surface)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    {card.title}
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: card.color }}>
                    {card.value}
                  </p>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.5rem',
                    background: `${card.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={24} color={card.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isSalesRep ? (
        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <button
              onClick={() => navigate('/products')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                padding: '2rem',
                background: '#dc2626',
                color: 'white',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s',
                minHeight: '150px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#b91c1c';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#dc2626';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Package size={48} />
              <span>Pick Items (Order)</span>
            </button>

            <button
              onClick={() => setShowDiscountModal(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                padding: '2rem',
                background: '#2563eb',
                color: 'white',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s',
                minHeight: '150px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Percent size={48} />
              <span>Request Discount</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Welcome to POS System
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Use the sidebar to navigate to different sections of the system.
          </p>
        </div>
      )}

      {/* Request Discount Modal */}
      {showDiscountModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
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
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Request Discount</h2>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <p>No pending orders available for discount request.</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Create an order first.</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
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
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      background: 'white',
                    }}
                  >
                    <option value="">Select an order</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.order_number} - {order.customer_name || 'Walk-in Customer'} - ₦{order.total.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedOrder && (
                  <>
                    <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Order Details:
                      </div>
                      <div style={{ fontSize: '0.875rem' }}>
                        <div>Customer: {selectedOrder.customer_name || 'Walk-in Customer'}</div>
                        <div>Total: ₦{selectedOrder.total.toFixed(2)}</div>
                        <div>Items: {selectedOrder.items.length}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                        Discount Amount (₦) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        placeholder="Enter discount amount"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                        }}
                      />
                      {discountAmount && selectedOrder && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                          New Total: ₦{(Number(selectedOrder.total) - Number(discountAmount)).toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                        Reason for Discount *
                      </label>
                      <textarea
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        rows={4}
                        placeholder="Explain why this discount is needed..."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowDiscountModal(false);
                      setSelectedOrder(null);
                      setDiscountAmount('');
                      setDiscountReason('');
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '500',
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
                        alert(`Discount request submitted for ${selectedOrder.order_number}.\nDiscount: ₦${discountAmount}\nReason: ${discountReason}\n\nThis will be reviewed by admin.`);
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
                      padding: '0.75rem 1.5rem',
                      background: !selectedOrder || !discountAmount || !discountReason ? 'var(--text-secondary)' : '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: !selectedOrder || !discountAmount || !discountReason ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
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
    </div>
  );
};

export default Dashboard;

