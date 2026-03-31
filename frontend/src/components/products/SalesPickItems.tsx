import { useState, useEffect } from 'react';
import { X, Search, Minus, Plus, ShoppingCart, Trash2, UserPlus, User } from 'lucide-react';
import { Product } from '../../services/productService';
import { customerService, Customer } from '../../services/customerService';

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
    onPlaceOrder: (cart: any[], customerId?: number, customerData?: any) => void;
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
    const [customerSearch, setCustomerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isNewCustomerModal, setIsNewCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ full_name: '', phone_number: '' });

    useEffect(() => {
        if (customerSearch.length >= 2) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    const results = await customerService.search(customerSearch);
                    setSearchResults(results);
                    setShowCustomerDropdown(true);
                } catch (error) {
                    console.error('Failed to search customers:', error);
                }
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchResults([]);
            setShowCustomerDropdown(false);
        }
    }, [customerSearch]);

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

    const handleCreateCustomer = async () => {
        if (!newCustomer.full_name || !newCustomer.phone_number) {
            alert('Please fill in name and phone number');
            return;
        }
        try {
            const customer = await customerService.create(newCustomer);
            setSelectedCustomer(customer);
            setIsNewCustomerModal(false);
            setNewCustomer({ full_name: '', phone_number: '' });
            alert('Customer created and selected');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create customer');
        }
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
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Pick Items</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Browse catalog and add to cart</p>
                        </div>
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
                                color: 'var(--text-secondary)'
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
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Find products by name, SKU, or category..."
                            value={pickItemsSearch}
                            onChange={(e) => setPickItemsSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                border: '1px solid var(--border)',
                                borderRadius: '0.75rem',
                                fontSize: '1rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '1.25rem',
                        }}
                    >
                        {filteredProductsForPick.map((product) => {
                            const cartItem = salesCart.find((item) => item.product_id === product.id);
                            return (
                                <div
                                    key={product.id}
                                    style={{
                                        background: cartItem ? 'rgba(220, 38, 38, 0.05)' : 'var(--background)',
                                        padding: '1.25rem',
                                        borderRadius: '1rem',
                                        border: cartItem ? '1.5px solid #dc2626' : '1px solid var(--border)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                        transition: 'all 0.2s ease',
                                        boxShadow: cartItem ? '0 4px 12px rgba(220, 38, 38, 0.1)' : 'none'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>{product.product_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace', background: 'var(--border)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', display: 'inline-block' }}>
                                            {product.sku}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '800', color: '#dc2626', fontSize: '1.25rem' }}>
                                        ₦{Number(product.price).toLocaleString()}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.875rem',
                                            color: product.quantity === 0 ? '#ef4444' : product.quantity <= product.min_stock_level ? '#f59e0b' : '#10b981',
                                            fontWeight: '600',
                                        }}
                                    >
                                        Stock: {product.quantity}
                                    </div>
                                    {cartItem ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                                            <button
                                                onClick={() => updateSalesCartQuantity(product.id, cartItem.quantity - 1)}
                                                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                                            >
                                                <Minus size={18} />
                                            </button>
                                            <span style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: '1.125rem' }}>{cartItem.quantity}</span>
                                            <button
                                                onClick={() => updateSalesCartQuantity(product.id, cartItem.quantity + 1)}
                                                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => addToSalesCart(product)}
                                            style={{ padding: '0.75rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '600', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                        >
                                            <Plus size={18} /> Add to Cart
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side - Cart & Customer */}
                <div style={{ width: '450px', background: 'var(--background)', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={20} /> Customer Details
                        </h3>
                        
                        {!selectedCustomer ? (
                            <div style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input
                                            type="text"
                                            placeholder="Search by name or phone..."
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setIsNewCustomerModal(true)}
                                        style={{ padding: '0.75rem', background: 'white', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        title="Add New Customer"
                                    >
                                        <UserPlus size={20} color="#dc2626" />
                                    </button>
                                </div>

                                {showCustomerDropdown && searchResults.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: '0.5rem', marginTop: '0.25rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 1100, maxHeight: '200px', overflowY: 'auto' }}>
                                        {searchResults.map((c) => (
                                            <div
                                                key={c.id}
                                                onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowCustomerDropdown(false); }}
                                                style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--background)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{c.full_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.phone_number}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ background: '#ecfdf5', border: '1.5px solid #10b981', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '700', color: '#064e3b' }}>{selectedCustomer.full_name}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#047857' }}>{selectedCustomer.phone_number}</div>
                                </div>
                                <button onClick={() => setSelectedCustomer(null)} style={{ background: 'transparent', border: 'none', color: '#059669', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingCart size={20} /> Current Order
                    </h3>
                    
                    {salesCart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem', background: 'var(--surface)', borderRadius: '0.75rem', border: '1px dashed var(--border)' }}>
                            <ShoppingCart size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            <p style={{ fontWeight: '500' }}>Cart is empty</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
                                {salesCart.map((item) => (
                                    <div key={item.product_id} style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '0.75rem', border: '1px solid var(--border)', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{item.product.product_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{item.product.sku}</div>
                                            </div>
                                            <button onClick={() => removeFromSalesCart(item.product_id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#94a3b8' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--background)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                                                <button onClick={() => updateSalesCartQuantity(item.product_id, item.quantity - 1)} style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.4rem', cursor: 'pointer' }}>
                                                    <Minus size={14} />
                                                </button>
                                                <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem' }}>{item.quantity}</span>
                                                <button onClick={() => updateSalesCartQuantity(item.product_id, item.quantity + 1)} style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d1fae5', color: '#10b981', border: 'none', borderRadius: '0.4rem', cursor: 'pointer' }}>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <div style={{ fontWeight: '700', color: '#dc2626' }}>₦{(Number(item.product.price) * item.quantity).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <span>Subtotal</span>
                                    <span>₦{calculateCartTotal().toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
                                    <span style={{ fontSize: '1.125rem', fontWeight: '700' }}>Total</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#dc2626' }}>₦{calculateCartTotal().toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onPlaceOrder(salesCart, selectedCustomer?.id, selectedCustomer)}
                                disabled={salesCart.length === 0}
                                style={{ 
                                    width: '100%', 
                                    padding: '1.25rem', 
                                    background: salesCart.length === 0 ? '#94a3b8' : '#dc2626', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '1rem', 
                                    cursor: salesCart.length === 0 ? 'not-allowed' : 'pointer', 
                                    fontWeight: '700', 
                                    fontSize: '1.125rem',
                                    boxShadow: salesCart.length === 0 ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem'
                                }}
                            >
                                <ShoppingCart size={22} />
                                Place Order
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* New Customer Modal Overlay */}
            {isNewCustomerModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }} onClick={() => setIsNewCustomerModal(false)}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Add New Customer</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Full Name *</label>
                            <input 
                                type="text"
                                value={newCustomer.full_name}
                                onChange={e => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                placeholder="Enter customer full name"
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Phone Number *</label>
                            <input 
                                type="text"
                                value={newCustomer.phone_number}
                                onChange={e => setNewCustomer({ ...newCustomer, phone_number: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setIsNewCustomerModal(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateCustomer} style={{ flex: 1, padding: '0.75rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' }}>Save & Select</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesPickItems;
