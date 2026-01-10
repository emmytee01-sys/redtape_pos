import { useEffect, useState } from 'react';
import { orderService, Order } from '../services/orderService';
import { productService, Product } from '../services/productService';
import { authService } from '../services/authService';
import { Plus, Check } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cart, setCart] = useState<Array<{ product_id: number; quantity: number }>>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const user = authService.getCurrentUser();
  const canCreate = user?.role === 'sales_rep' || user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadOrders();
    if (canCreate) {
      loadProducts();
    }
  }, []);

  const loadOrders = async () => {
    try {
      // Sales reps only see pending and submitted orders
      const data = await orderService.getAll();
      const filteredData = user?.role === 'sales_rep' 
        ? data.filter((order) => order.status === 'pending' || order.status === 'submitted')
        : data;
      setOrders(filteredData);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const addToCart = (productId: number) => {
    const existing = cart.find((item) => item.product_id === productId);
    if (existing) {
      setCart(cart.map((item) => (item.product_id === productId ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { product_id: productId, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.product_id !== productId));
    } else {
      setCart(cart.map((item) => (item.product_id === productId ? { ...item, quantity } : item)));
    }
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      await orderService.create({
        customer_name: customerName || undefined,
        customer_email: customerEmail || undefined,
        customer_phone: customerPhone || undefined,
        items: cart,
        notes: notes || undefined,
      });
      setShowModal(false);
      setCart([]);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setNotes('');
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create order');
    }
  };

  const handleSubmitOrder = async (orderId: number) => {
    try {
      await orderService.submit(orderId);
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: '#d1fae5', color: '#065f46' };
      case 'submitted':
        return { bg: '#dbeafe', color: '#1e40af' };
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Orders</h1>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            <Plus size={18} />
            Create Order
          </button>
        )}
      </div>

      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {orders.map((order) => {
          const statusStyle = getStatusColor(order.status);
          return (
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
                    Created: {new Date(order.created_at).toLocaleString()}
                  </p>
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
                    {order.status.toUpperCase()}
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

              {order.status === 'pending' && canCreate && order.sales_rep_id === user?.id && (
                <button
                  onClick={() => {
                    if (confirm('Submit this order for payment confirmation?')) {
                      handleSubmitOrder(order.id);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#dc2626',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  <Check size={16} />
                  Submit for Payment
                </button>
              )}
              {order.status === 'submitted' && user?.role === 'sales_rep' && (
                <div style={{ padding: '0.75rem', background: '#dbeafe', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#1e40af' }}>
                  Order submitted. Waiting for accountant confirmation.
                </div>
              )}
            </div>
          );
        })}
        {orders.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No orders found
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Create Order</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Add Products
              </label>
              <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '200px', overflow: 'auto', marginBottom: '1rem' }}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'var(--background)',
                      borderRadius: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{product.product_name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        ₦{product.price.toFixed(2)} | Stock: {product.quantity}
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={product.quantity === 0}
                      style={{
                        padding: '0.5rem 1rem',
                        background: product.quantity === 0 ? 'var(--text-secondary)' : 'var(--primary)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: product.quantity === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {cart.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Cart</h3>
                {cart.map((item) => {
                  const product = products.find((p) => p.id === item.product_id);
                  return (
                    <div
                      key={item.product_id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'var(--background)',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '500' }}>{product?.product_name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          ₦{product?.price.toFixed(2)} each
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: 'var(--error)',
                            color: 'white',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          -
                        </button>
                        <span style={{ minWidth: '2rem', textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                          disabled={product && item.quantity >= product.quantity}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: product && item.quantity >= product.quantity ? 'var(--text-secondary)' : 'var(--success)',
                            color: 'white',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: product && item.quantity >= product.quantity ? 'not-allowed' : 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCart([]);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={cart.length === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: cart.length === 0 ? 'var(--text-secondary)' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

