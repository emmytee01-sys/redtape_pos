import { useEffect, useState } from 'react';
import { orderService, Order } from '../services/orderService';
import { productService, Product } from '../services/productService';
import { authService } from '../services/authService';
import { Plus, Check, ShoppingCart, Clock, DollarSign, Filter, X, Edit, Trash2, Eye } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cart, setCart] = useState<Array<{ product_id: number; quantity: number }>>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const user = authService.getCurrentUser();
  const canCreate = user?.role === 'sales_rep' || user?.role === 'admin' || user?.role === 'manager';
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const isAccountant = user?.role === 'accountant';
  const isSalesRep = user?.role === 'sales_rep';

  useEffect(() => {
    loadOrders();
    if (canCreate) {
      loadProducts();
    }
  }, [statusFilter, startDate, endDate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (startDate) {
        filters.startDate = startDate;
      }
      
      if (endDate) {
        filters.endDate = endDate;
      }
      
      const data = await orderService.getAll(filters);
      
      // Role-based filtering
      let filteredData = data;
      
      if (isSalesRep) {
        // Sales reps see their own orders (pending, submitted, and paid - paid orders are view-only)
        filteredData = data.filter(
          (order) => 
            (order.status === 'pending' || order.status === 'submitted' || order.status === 'paid') && 
            order.sales_rep_id === user?.id
        );
      } else if (isAccountant) {
        // Accountants see submitted and paid orders
        filteredData = data.filter(
          (order) => order.status === 'submitted' || order.status === 'paid'
        );
      }
      // Admin/Manager see all orders (no additional filtering needed)
      
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

  // Calculate stats from orders
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    submitted: orders.filter((o) => o.status === 'submitted').length,
    totalRevenue: orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + Number(o.total), 0),
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

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setCustomerName(order.customer_name || '');
    setCustomerEmail(order.customer_email || '');
    setCustomerPhone(order.customer_phone || '');
    setNotes(order.notes || '');
    setCart(order.items.map(item => ({
      product_id: item.product_id!,
      quantity: item.quantity,
    })));
    setShowEditModal(true);
  };

  const handleUpdateOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (!selectedOrder) return;

    try {
      await orderService.update(selectedOrder.id, {
        customer_name: customerName || undefined,
        customer_email: customerEmail || undefined,
        customer_phone: customerPhone || undefined,
        items: cart,
        notes: notes || undefined,
      });
      setShowEditModal(false);
      setSelectedOrder(null);
      setCart([]);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setNotes('');
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update order');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      await orderService.delete(orderId);
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete order');
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const canEditOrder = (order: Order) => {
    return isSalesRep && order.status === 'pending' && order.sales_rep_id === user?.id;
  };

  const canDeleteOrder = (order: Order) => {
    return isSalesRep && order.status === 'pending' && order.sales_rep_id === user?.id;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: '#d1fae5', color: '#065f46' };
      case 'submitted':
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'pending':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#991b1b' };
      default:
        return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Orders</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {(isAdmin || isAccountant) && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: showFilters ? '#dc2626' : 'var(--surface)',
                color: showFilters ? 'white' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              <Filter size={18} />
              Filters
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
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
                fontWeight: '500',
              }}
            >
              <Plus size={18} />
              Create Order
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Total Orders
            </span>
            <ShoppingCart size={20} color="#6b7280" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text)' }}>{stats.total}</div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Pending
            </span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>{stats.pending}</div>
          {stats.submitted > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              ({stats.submitted} submitted)
            </div>
          )}
        </div>

        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Paid
            </span>
            <DollarSign size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{stats.paid}</div>
          {stats.totalRevenue > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              ₦{stats.totalRevenue.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (isAdmin || isAccountant) && (
        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Filter Orders</h3>
            <button
              onClick={clearFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              <X size={16} />
              Clear All
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--background)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Order #
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Customer
                </th>
                {isAdmin && (
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Sales Rep
                  </th>
                )}
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Items
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Total
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Date
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusStyle = getStatusColor(order.status);
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>
                      {order.order_number}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {order.customer_name || 'Walk-in'}
                      {order.customer_phone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {order.customer_phone}
                        </div>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {order.sales_rep_name || 'N/A'}
                      </td>
                    )}
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          fontWeight: '600',
                          display: 'inline-block',
                        }}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>
                      ₦{Number(order.total).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                        {/* View button - always available */}
                        <button
                          onClick={() => handleViewOrder(order)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.5rem 0.75rem',
                            background: '#2563eb',
                            color: 'white',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                          }}
                          title="View Order Details"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit button - only for pending orders owned by sales rep */}
                        {canEditOrder(order) && (
                          <button
                            onClick={() => handleEditOrder(order)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.5rem 0.75rem',
                              background: '#f59e0b',
                              color: 'white',
                              borderRadius: '0.5rem',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                            }}
                            title="Edit Order"
                          >
                            <Edit size={14} />
                          </button>
                        )}

                        {/* Delete button - only for pending orders owned by sales rep */}
                        {canDeleteOrder(order) && (
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.5rem 0.75rem',
                              background: '#ef4444',
                              color: 'white',
                              borderRadius: '0.5rem',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                            }}
                            title="Delete Order"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}

                        {/* Submit button - only for pending orders owned by sales rep */}
                        {order.status === 'pending' && canCreate && order.sales_rep_id === user?.id && (
                          <button
                            onClick={() => {
                              if (confirm('Submit this order for payment confirmation?')) {
                                handleSubmitOrder(order.id);
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.5rem 0.75rem',
                              background: '#dc2626',
                              color: 'white',
                              borderRadius: '0.5rem',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                            }}
                            title="Submit for Payment"
                          >
                            <Check size={14} />
                            Submit
                          </button>
                        )}

                        {/* Status indicator for submitted orders */}
                        {order.status === 'submitted' && isSalesRep && (
                          <span style={{ fontSize: '0.75rem', color: '#1e40af', padding: '0.5rem' }}>
                            Awaiting Payment
                          </span>
                        )}

                        {/* Status indicator for paid orders */}
                        {order.status === 'paid' && (
                          <span style={{ fontSize: '0.75rem', color: '#10b981', padding: '0.5rem' }}>
                            Paid
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {orders.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1rem', fontWeight: '500' }}>No orders found</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {canCreate ? 'Create your first order to get started' : 'No orders match your filters'}
            </p>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
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
                  placeholder="Optional"
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
                  placeholder="Optional"
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
                  placeholder="Optional"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Add Products
              </label>
              <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '200px', overflow: 'auto', marginBottom: '1rem' }}>
                {products.filter((p) => p.quantity > 0).map((product) => (
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
                        ₦{Number(product.price).toFixed(2)} | Stock: {product.quantity}
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={product.quantity === 0}
                      style={{
                        padding: '0.5rem 1rem',
                        background: product.quantity === 0 ? 'var(--text-secondary)' : '#dc2626',
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
                          ₦{product ? Number(product.price).toFixed(2) : '0.00'} each
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#dc2626',
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
                            background: product && item.quantity >= product.quantity ? 'var(--text-secondary)' : '#10b981',
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
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    Total: ₦{cart.reduce((sum, item) => {
                      const product = products.find((p) => p.id === item.product_id);
                      return sum + (product ? Number(product.price) * item.quantity : 0);
                    }, 0).toFixed(2)}
                  </div>
                </div>
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
                placeholder="Optional notes about this order"
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
                  background: cart.length === 0 ? 'var(--text-secondary)' : '#dc2626',
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

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
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
          onClick={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
            setCart([]);
            setCustomerName('');
            setCustomerEmail('');
            setCustomerPhone('');
            setNotes('');
          }}
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              Edit Order - {selectedOrder.order_number}
            </h2>

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
                  placeholder="Optional"
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
                  placeholder="Optional"
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
                  placeholder="Optional"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Add Products
              </label>
              <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '200px', overflow: 'auto', marginBottom: '1rem' }}>
                {products.filter((p) => p.quantity > 0).map((product) => (
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
                        ₦{Number(product.price).toFixed(2)} | Stock: {product.quantity}
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={product.quantity === 0}
                      style={{
                        padding: '0.5rem 1rem',
                        background: product.quantity === 0 ? 'var(--text-secondary)' : '#dc2626',
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
                          ₦{product ? Number(product.price).toFixed(2) : '0.00'} each
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#dc2626',
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
                            background: product && item.quantity >= product.quantity ? 'var(--text-secondary)' : '#10b981',
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
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    Total: ₦{cart.reduce((sum, item) => {
                      const product = products.find((p) => p.id === item.product_id);
                      return sum + (product ? Number(product.price) * item.quantity : 0);
                    }, 0).toFixed(2)}
                  </div>
                </div>
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
                placeholder="Optional notes about this order"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedOrder(null);
                  setCart([]);
                  setCustomerName('');
                  setCustomerEmail('');
                  setCustomerPhone('');
                  setNotes('');
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
                onClick={handleUpdateOrder}
                disabled={cart.length === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: cart.length === 0 ? 'var(--text-secondary)' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Update Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
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
          onClick={() => {
            setShowViewModal(false);
            setSelectedOrder(null);
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              Order Details - {selectedOrder.order_number}
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Customer Name
                  </p>
                  <p style={{ fontWeight: '500' }}>{selectedOrder.customer_name || 'Walk-in Customer'}</p>
                </div>
                {selectedOrder.customer_phone && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Phone
                    </p>
                    <p style={{ fontWeight: '500' }}>{selectedOrder.customer_phone}</p>
                  </div>
                )}
                {selectedOrder.customer_email && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Email
                    </p>
                    <p style={{ fontWeight: '500' }}>{selectedOrder.customer_email}</p>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Status
                  </p>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      background: getStatusColor(selectedOrder.status).bg,
                      color: getStatusColor(selectedOrder.status).color,
                      fontWeight: '600',
                      display: 'inline-block',
                    }}
                  >
                    {selectedOrder.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Date
                  </p>
                  <p style={{ fontWeight: '500' }}>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Order Items</h3>
              <div style={{ background: 'var(--background)', borderRadius: '0.5rem', padding: '1rem' }}>
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{item.product_name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {item.quantity} x ₦{item.unit_price ? Number(item.unit_price).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div style={{ fontWeight: '600' }}>₦{item.subtotal ? Number(item.subtotal).toFixed(2) : '0.00'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '2px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: '500' }}>₦{Number(selectedOrder.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Tax:</span>
                <span style={{ fontWeight: '500' }}>₦{Number(selectedOrder.tax).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '700', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <span>Total:</span>
                <span>₦{Number(selectedOrder.total).toFixed(2)}</span>
              </div>
            </div>

            {selectedOrder.notes && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Notes
                </p>
                <p style={{ padding: '1rem', background: 'var(--background)', borderRadius: '0.5rem' }}>
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedOrder(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
