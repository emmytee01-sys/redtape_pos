import { useEffect, useState } from 'react';
import { productService, Product } from '../services/productService';
import { alertService } from '../services/alertService'; // I need to check if this exists or create it
import {
    AlertTriangle,
    ArrowRight,
    Package,
    TrendingDown,
    ShoppingCart,
    Bell,
    CheckCircle,
    Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InventoryAlerts = () => {
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const lowStock = await productService.getLowStock();
            setLowStockProducts(lowStock.filter(p => p.quantity > 0));
            setOutOfStockProducts(lowStock.filter(p => p.quantity <= 0));
        } catch (error) {
            console.error('Failed to load inventory alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading alerts...</div>;
    }

    const totalAlerts = lowStockProducts.length + outOfStockProducts.length;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Bell color="#dc2626" />
                        Inventory Alerts
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Items requiring immediate attention or restocking</p>
                </div>
                {totalAlerts > 0 && (
                    <button
                        onClick={() => navigate('/vendors')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: '#2563eb',
                            color: 'white',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '500',
                        }}
                    >
                        <Truck size={18} />
                        Go to Vendors (Restock)
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{
                    background: 'var(--surface)',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: 'var(--shadow)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '0.5rem' }}>
                        <AlertTriangle color="#ef4444" size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>{outOfStockProducts.length}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Out of Stock</div>
                    </div>
                </div>

                <div style={{
                    background: 'var(--surface)',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: 'var(--shadow)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '0.5rem' }}>
                        <TrendingDown color="#f59e0b" size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>{lowStockProducts.length}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Low Stock Items</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Out of Stock Section */}
                <div style={{
                    background: 'var(--surface)',
                    borderRadius: '0.75rem',
                    boxShadow: 'var(--shadow)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: '#fee2e2', color: '#991b1b', fontWeight: '700' }}>
                        CRITICAL: Out of Stock
                    </div>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {outOfStockProducts.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                                <p>No items are out of stock!</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {outOfStockProducts.map(product => (
                                        <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '600' }}>{product.product_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {product.sku}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => navigate(`/products?search=${product.sku}`)}
                                                    style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Low Stock Section */}
                <div style={{
                    background: 'var(--surface)',
                    borderRadius: '0.75rem',
                    boxShadow: 'var(--shadow)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: '#fef3c7', color: '#92400e', fontWeight: '700' }}>
                        WARNING: Low Stock
                    </div>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {lowStockProducts.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                                <p>All stock levels are healthy!</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {lowStockProducts.map(product => (
                                        <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '600' }}>{product.product_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {product.sku}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#f59e0b' }}>
                                                    {product.quantity} left
                                                </div>
                                                <div style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>Min: {product.min_stock_level}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => navigate(`/products?search=${product.sku}`)}
                                                    style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryAlerts;
