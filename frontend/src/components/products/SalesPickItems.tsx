import { X, Search, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Product } from '../../services/productService';

interface SalesPickItemsProps {
    show: boolean;
    onClose: () => void;
    products: Product[];
    pickItemsSearch: string;
    setPickItemsSearch: (val: string) => void;
    salesCart: Array<{ product_id: number; product: Product; quantity: number }>;
    addToSalesCart: (p: Product) => void;
    updateSalesCartQuantity: (id: number, qty: number) => void;
    removeFromSalesCart: (id: number) => void;
    onPlaceOrder: (cart: any[]) => void;
}

const SalesPickItems = ({
    show,
    onClose,
    products,
    pickItemsSearch,
    setPickItemsSearch,
    salesCart,
    addToSalesCart,
    updateSalesCartQuantity,
    removeFromSalesCart,
    onPlaceOrder
}: SalesPickItemsProps) => {
    if (!show) return null;

    const filteredProductsForPick = products.filter(
        (p) =>
            p.is_active &&
            (p.product_name.toLowerCase().includes(pickItemsSearch.toLowerCase()) ||
                p.sku.toLowerCase().includes(pickItemsSearch.toLowerCase()) ||
                (p.category && p.category.toLowerCase().includes(pickItemsSearch.toLowerCase())))
    );

    const calculateCartTotal = () => {
        return salesCart.reduce((total, item) => {
            return total + Number(item.product.price) * item.quantity;
        }, 0);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                zIndex: 1000,
            }}
            onClick={() => {
                if (salesCart.length === 0) onClose();
            }}
        >
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    background: 'var(--surface)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Side - Product Search */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Pick Items</h2>
                        <button
                            onClick={() => {
                                if (salesCart.length === 0 || confirm('Clear cart and close?')) {
                                    onClose();
                                }
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.5rem',
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Search
                            size={20}
                            style={{
                                position: 'absolute',
                                left: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search products by name, SKU, or category..."
                            value={pickItemsSearch}
                            onChange={(e) => setPickItemsSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                border: '1px solid var(--border)',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                            }}
                            autoFocus
                        />
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '1rem',
                        }}
                    >
                        {filteredProductsForPick.map((product) => {
                            const cartItem = salesCart.find((item) => item.product_id === product.id);
                            return (
                                <div
                                    key={product.id}
                                    style={{
                                        background: cartItem ? '#fef3c7' : 'var(--background)',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{product.product_name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                            {product.sku}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '700', color: '#dc2626', fontSize: '1.125rem' }}>
                                        ₦{Number(product.price).toFixed(2)}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.875rem',
                                            color: product.quantity === 0 ? '#ef4444' : product.quantity <= product.min_stock_level ? '#f59e0b' : '#10b981',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Stock: {product.quantity}
                                    </div>
                                    {cartItem ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <button
                                                onClick={() => updateSalesCartQuantity(product.id, cartItem.quantity - 1)}
                                                style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>{cartItem.quantity}</span>
                                            <button
                                                onClick={() => updateSalesCartQuantity(product.id, cartItem.quantity + 1)}
                                                disabled={cartItem.quantity >= product.quantity}
                                                style={{ padding: '0.25rem 0.5rem', background: cartItem.quantity >= product.quantity ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: cartItem.quantity >= product.quantity ? 'not-allowed' : 'pointer' }}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => addToSalesCart(product)}
                                            disabled={product.quantity === 0}
                                            style={{ padding: '0.5rem', background: product.quantity === 0 ? '#9ca3af' : '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: product.quantity === 0 ? 'not-allowed' : 'pointer', fontWeight: '500', marginTop: '0.5rem' }}
                                        >
                                            Add to Cart
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side - Cart */}
                <div style={{ width: '400px', background: 'var(--background)', borderLeft: '1px solid var(--border)', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Cart</h3>
                    {salesCart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                            <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>Your cart is empty</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem' }}>
                                {salesCart.map((item) => (
                                    <div key={item.product_id} style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.product.product_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.product.sku}</div>
                                            </div>
                                            <button onClick={() => removeFromSalesCart(item.product_id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#ef4444' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <button onClick={() => updateSalesCartQuantity(item.product_id, item.quantity - 1)} style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                    <Minus size={14} />
                                                </button>
                                                <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</span>
                                                <button onClick={() => updateSalesCartQuantity(item.product_id, item.quantity + 1)} disabled={item.quantity >= item.product.quantity} style={{ padding: '0.25rem 0.5rem', background: item.quantity >= item.product.quantity ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: item.quantity >= item.product.quantity ? 'not-allowed' : 'pointer' }}>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <div style={{ fontWeight: '600', color: '#dc2626' }}>₦{(Number(item.product.price) * item.quantity).toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                                    <span style={{ fontWeight: '600' }}>₦{calculateCartTotal().toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '700', marginTop: '1rem' }}>
                                    <span>Total</span>
                                    <span style={{ color: '#dc2626' }}>₦{calculateCartTotal().toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onPlaceOrder(salesCart)}
                                style={{ width: '100%', padding: '1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}
                            >
                                Place Order
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesPickItems;
