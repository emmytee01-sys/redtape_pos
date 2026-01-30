import { X } from 'lucide-react';
import { Product } from '../../services/productService';

interface ProductDetailsModalProps {
    show: boolean;
    onClose: () => void;
    product: Product | null;
}

const ProductDetailsModal = ({ show, onClose, product }: ProductDetailsModalProps) => {
    if (!show || !product) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Product Details</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>SKU</label><p style={{ fontFamily: 'monospace' }}>{product.sku}</p></div>
                    <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Product Name</label><p style={{ fontSize: '1.125rem', fontWeight: '600' }}>{product.product_name}</p></div>
                    <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Category</label><p>{product.category || 'Uncategorized'}</p></div>
                    {product.description && <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description</label><p>{product.description}</p></div>}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Price</label><p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#dc2626' }}>₦{Number(product.price).toFixed(2)}</p></div>
                        <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quantity</label><p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{product.quantity}</p></div>
                        <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Min Stock</label><p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{product.min_stock_level}</p></div>
                    </div>
                </div>
                <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                    <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsModal;
