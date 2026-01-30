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
  const isAccountant = user?.role === 'accountant' || user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const paymentsData = await paymentService.getAll();
      setPayments(paymentsData);

      if (isAccountant) {
        const ordersData = await orderService.getAll({ status: 'submitted' });
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Failed to load payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndConfirmPayment = async (order: Order) => {
    try {
      const payment = await paymentService.create({
        order_id: order.id,
        payment_method: paymentMethod,
        notes: paymentNotes,
      });

      await paymentService.confirm(payment.id);
      alert('Payment confirmed! Receipt generated.');
      await loadData();
      setShowPaymentModal(false);
      setSelectedOrder(null);
      setPaymentMethod('cash');
      setPaymentNotes('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to process payment');
    }
  };

  const getBackendUrl = () => {
    if (import.meta.env.DEV) return 'http://localhost:3000';
    return import.meta.env.VITE_BACKEND_URL || 'https://redtapepos.com.ng';
  };

  const handleDownloadReceipt = (filePath: string | null) => {
    if (!filePath) {
      alert('Receipt not available');
      return;
    }
    let receiptUrl: string;
    if (filePath.startsWith('http')) {
      receiptUrl = filePath;
    } else if (filePath.startsWith('/')) {
      const filename = filePath.split('/').pop() || '';
      receiptUrl = `${getBackendUrl()}/receipts/${filename}`;
    } else {
      receiptUrl = `${getBackendUrl()}/${filePath}`;
    }
    window.open(receiptUrl, '_blank');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
        {isAccountant ? 'Payment Confirmation' : 'Payments'}
      </h1>

      {/* Submitted Orders (Pending) */}
      {isAccountant && orders.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
            Pending Payment Confirmation
          </h2>
          <div style={{ background: 'var(--surface)', borderRadius: '0.75rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Order #</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Customer</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Sales Rep</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>{order.order_number}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{order.customer_name || 'Walk-in Customer'}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>{order.sales_rep_name || 'N/A'}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>{new Date(order.created_at).toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '700' }}>₦{Number(order.total).toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowPaymentModal(true);
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#dc2626', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                      >
                        <Check size={14} />
                        Confirm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmed Payments */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
          {isAccountant ? 'Confirmed Payments' : 'Recent Payments'}
        </h2>
        <div style={{ background: 'var(--surface)', borderRadius: '0.75rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Order #</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Customer</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Method</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Date Confirmed</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Receipts</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>{payment.order_number}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{payment.customer_name || 'N/A'}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '600', color: '#4b5563' }}>
                      {payment.payment_method === 'pos' ? 'POS' : payment.payment_method?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {payment.confirmed_at ? new Date(payment.confirmed_at).toLocaleString() : new Date(payment.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '700' }}>₦{Number(payment.amount).toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={async () => {
                          const receipt = await paymentService.getReceipt(payment.id);
                          handleDownloadReceipt(receipt.file_path);
                        }}
                        style={{ padding: '0.375rem', background: '#eff6ff', color: '#2563eb', borderRadius: '0.375rem', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                        title="Download Receipt"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={async () => {
                          const receipt = await paymentService.getReceipt(payment.id);
                          if (receipt.file_path) {
                            let receiptUrl: string;
                            if (receipt.file_path.startsWith('http')) {
                              receiptUrl = receipt.file_path;
                            } else if (receipt.file_path.startsWith('/')) {
                              const filename = receipt.file_path.split('/').pop() || '';
                              receiptUrl = `${getBackendUrl()}/receipts/${filename}`;
                            } else {
                              receiptUrl = `${getBackendUrl()}/${receipt.file_path}`;
                            }
                            window.open(receiptUrl, '_blank');
                          }
                        }}
                        style={{ padding: '0.375rem', background: '#ecfdf5', color: '#10b981', borderRadius: '0.375rem', border: '1px solid #a7f3d0', cursor: 'pointer' }}
                        title="Print Receipt"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No payments found
            </div>
          )}
        </div>
      </div>

      {isAccountant && orders.length === 0 && payments.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No pending orders or confirmed payments found
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowPaymentModal(false); setSelectedOrder(null); }}>
          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Confirm Payment</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Order: {selectedOrder.order_number}</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#dc2626' }}>Amount: ₦{Number(selectedOrder.total).toFixed(2)}</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Payment Method *</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '1rem', background: 'white' }}>
                <option value="cash">Cash</option>
                <option value="pos">POS</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Notes (Optional)</label>
              <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '1rem', resize: 'vertical' }} placeholder="Add any notes about this payment" />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowPaymentModal(false); setSelectedOrder(null); }} style={{ padding: '0.75rem 1.5rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={() => handleCreateAndConfirmPayment(selectedOrder)} style={{ padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={18} /> Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
