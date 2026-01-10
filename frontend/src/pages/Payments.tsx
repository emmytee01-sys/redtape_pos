import { useEffect, useState } from 'react';
import { paymentService, Payment } from '../services/paymentService';
import { orderService, Order } from '../services/orderService';
import { authService } from '../services/authService';
import { Check, Download, Printer } from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'bank_transfer' | 'other'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const user = authService.getCurrentUser();
  const canConfirm = user?.role === 'accountant' || user?.role === 'admin';
  const isAccountant = user?.role === 'accountant' || user?.role === 'admin';

  useEffect(() => {
    if (isAccountant) {
      loadSubmittedOrders();
      loadPayments();
    } else {
    loadPayments();
    }
  }, []);

  const loadPayments = async () => {
    try {
      const data = await paymentService.getAll();
      setPayments(data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmittedOrders = async () => {
    try {
      const data = await orderService.getAll({ status: 'submitted' });
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load submitted orders:', error);
      setLoading(false);
    }
  };

  const handleCreateAndConfirmPayment = async (order: Order) => {
    try {
      // Create payment first
      const payment = await paymentService.create({
        order_id: order.id,
        payment_method: paymentMethod,
        notes: paymentNotes,
      });

      // Then confirm it
      const result = await paymentService.confirm(payment.id);
      alert('Payment confirmed! Receipt generated.');
      await loadPayments();
      await loadSubmittedOrders();
      setShowPaymentModal(false);
      setSelectedOrder(null);
      setPaymentMethod('cash');
      setPaymentNotes('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to process payment');
    }
  };

  const handleConfirmPayment = async (paymentId: number) => {
    if (!confirm('Confirm this payment?')) return;

    try {
      const result = await paymentService.confirm(paymentId);
      alert('Payment confirmed! Receipt generated.');
      await loadPayments();
      if (isAccountant) {
        await loadSubmittedOrders();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to confirm payment');
    }
  };

  const handleDownloadReceipt = (filePath: string | null) => {
    if (!filePath) {
      alert('Receipt not available');
      return;
    }
    window.open(`http://localhost:3000/${filePath}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#d1fae5', color: '#065f46' };
      case 'pending':
        return { bg: '#fef3c7', color: '#92400e' };
      default:
        return { bg: '#fee2e2', color: '#991b1b' };
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
        {isAccountant ? 'Payment Confirmation' : 'Payments'}
      </h1>

      {/* Submitted Orders for Accountant */}
      {isAccountant && orders.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Pending Payment Confirmation</h2>
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '0.75rem',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            {orders.map((order) => (
              <div key={order.id} style={{ borderBottom: '1px solid var(--border)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {order.order_number}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Customer: {order.customer_name || 'Walk-in Customer'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Sales Rep: {order.sales_rep_name || 'N/A'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Created: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        background: '#fef3c7',
                        color: '#92400e',
                        fontWeight: '500',
                      }}
                    >
                      PENDING
                    </span>
                    <p style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: '700' }}>
                      ₦{order.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Items:</p>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <span>
                        {item.product_name} x {item.quantity}
                      </span>
                      <span>₦{item.subtotal?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowPaymentModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: '#dc2626',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  <Check size={18} />
                  Confirm Payment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Payments */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
          {isAccountant ? 'Confirmed Payments' : 'Payments'}
        </h2>
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {payments.map((payment) => {
          const statusStyle = getStatusColor(payment.payment_status);
          return (
            <div key={payment.id} style={{ borderBottom: '1px solid var(--border)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Order: {payment.order_number}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Customer: {payment.customer_name || 'N/A'}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Payment Method: {payment.payment_method === 'card' ? 'POS' : payment.payment_method.toUpperCase()}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Created: {new Date(payment.created_at).toLocaleString()}
                  </p>
                  {payment.confirmed_at && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Confirmed: {new Date(payment.confirmed_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      fontWeight: '500',
                    }}
                  >
                    {payment.payment_status.toUpperCase()}
                  </span>
                  <p style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: '700' }}>
                    ₦{payment.amount.toFixed(2)}
                  </p>
                </div>
              </div>

              {payment.payment_status === 'pending' && canConfirm && (
                <button
                  onClick={() => handleConfirmPayment(payment.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--accent)',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  <Check size={16} />
                  Confirm Payment
                </button>
              )}

              {payment.payment_status === 'confirmed' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    paymentService.getReceipt(payment.id).then((receipt) => {
                      handleDownloadReceipt(receipt.file_path);
                    });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                      background: '#2563eb',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                      fontWeight: '500',
                  }}
                >
                  <Download size={16} />
                  Download Receipt
                </button>
                  <button
                    onClick={() => {
                      paymentService.getReceipt(payment.id).then((receipt) => {
                        if (receipt.file_path) {
                          window.open(`http://localhost:3000/${receipt.file_path}`, '_blank');
                        }
                      });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    <Printer size={16} />
                    Print Receipt
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {payments.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {isAccountant ? 'No confirmed payments found' : 'No payments found'}
          </div>
        )}
        {isAccountant && orders.length === 0 && payments.length === 0 && !loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No pending orders or payments found
          </div>
        )}
      </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedOrder && (
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
            setShowPaymentModal(false);
            setSelectedOrder(null);
            setPaymentMethod('cash');
            setPaymentNotes('');
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Confirm Payment</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Order: {selectedOrder.order_number}
              </p>
              <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#dc2626' }}>
                Amount: ₦{selectedOrder.total.toFixed(2)}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  background: 'white',
                }}
              >
                <option value="cash">Cash</option>
                <option value="pos">POS</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Notes (Optional)
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
                placeholder="Add any notes about this payment"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOrder(null);
                  setPaymentMethod('cash');
                  setPaymentNotes('');
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
                onClick={() => handleCreateAndConfirmPayment(selectedOrder)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Check size={18} />
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

