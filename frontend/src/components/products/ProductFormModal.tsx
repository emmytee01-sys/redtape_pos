import { X } from 'lucide-react';
import { Vendor } from '../../services/vendorService';

interface ProductFormModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: () => void;
    categories: string[];
    vendors: Vendor[];
    selectedVendors: number[];
    setSelectedVendors: (ids: number[]) => void;
    vendorPrices: Record<number, string>;
    setVendorPrices: (prices: Record<number, string>) => void;
}

const ProductFormModal = ({
    show,
    onClose,
    title,
    formData,
    setFormData,
    onSubmit,
    categories,
    vendors,
    selectedVendors,
    setSelectedVendors,
    vendorPrices,
    setVendorPrices
}: ProductFormModalProps) => {
    if (!show) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>SKU *</label>
                        <input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Product Name *</label>
                        <input value={formData.product_name} onChange={e => setFormData({ ...formData, product_name: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Category</label>
                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                            <option value="">Select Category</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Price (₦) *</label>
                        <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Initial Qty</label>
                        <input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Low Stock Level</label>
                        <input type="number" value={formData.min_stock_level} onChange={e => setFormData({ ...formData, min_stock_level: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Description</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', height: '80px' }} />
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Sourcing (Optional)</h3>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
                        {vendors.map(vendor => (
                            <div key={vendor.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedVendors.includes(vendor.id)}
                                    onChange={e => {
                                        if (e.target.checked) setSelectedVendors([...selectedVendors, vendor.id]);
                                        else setSelectedVendors(selectedVendors.filter(id => id !== vendor.id));
                                    }}
                                />
                                <span style={{ flex: 1, fontSize: '0.875rem' }}>{vendor.vendor_name}</span>
                                {selectedVendors.includes(vendor.id) && (
                                    <input
                                        type="number"
                                        placeholder="Cost (₦)"
                                        value={vendorPrices[vendor.id] || ''}
                                        onChange={e => setVendorPrices({ ...vendorPrices, [vendor.id]: e.target.value })}
                                        style={{ width: '100px', padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: '0.25rem' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onSubmit} style={{ padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' }}>Save Product</button>
                </div>
            </div>
        </div>
    );
};

export default ProductFormModal;
