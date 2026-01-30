import { Eye, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Product } from '../../services/productService';

interface ProductTableProps {
    products: Product[];
    canManage: boolean;
    selectedProducts: number[];
    onToggleSelect: (id: number) => void;
    onSelectAll: () => void;
    onViewDetails: (p: Product) => void;
    onEdit: (p: Product) => void;
    onToggleStatus: (p: Product) => void;
}

const ProductTable = ({
    products,
    canManage,
    selectedProducts,
    onToggleSelect,
    onSelectAll,
    onViewDetails,
    onEdit,
    onToggleStatus
}: ProductTableProps) => {
    return (
        <div style={{ background: 'var(--surface)', borderRadius: '0.75rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: 'var(--background)', borderBottom: '2px solid var(--border)' }}>
                        {canManage && (
                            <th style={{ padding: '1rem', textAlign: 'center', width: '50px' }}>
                                <input type="checkbox" checked={selectedProducts.length === products.length && products.length > 0} onChange={onSelectAll} />
                            </th>
                        )}
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>SKU</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Product Name</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Category</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.875rem' }}>Price</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>Stock</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>Status</th>
                        {canManage && <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', background: selectedProducts.includes(product.id) ? '#fef3c7' : 'transparent' }}>
                            {canManage && (
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => onToggleSelect(product.id)} />
                                </td>
                            )}
                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>{product.sku}</td>
                            <td style={{ padding: '1rem', fontWeight: '500', cursor: 'pointer' }} onClick={() => onViewDetails(product)}>{product.product_name}</td>
                            <td style={{ padding: '1rem' }}><span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca' }}>{product.category || 'Uncategorized'}</span></td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>₦{Number(product.price).toFixed(2)}</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <span style={{ color: product.quantity === 0 ? '#ef4444' : product.quantity <= product.min_stock_level ? '#f59e0b' : '#10b981', fontWeight: '600' }}>{product.quantity}</span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', background: product.is_active ? '#d1fae5' : '#fee2e2', color: product.is_active ? '#065f46' : '#991b1b' }}>
                                    {product.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            {canManage && (
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        <button onClick={() => onViewDetails(product)} style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'white', cursor: 'pointer' }}><Eye size={16} color="#2563eb" /></button>
                                        <button onClick={() => onEdit(product)} style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'white', cursor: 'pointer' }}><Edit size={16} color="#dc2626" /></button>
                                        <button onClick={() => onToggleStatus(product)} style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'white', cursor: 'pointer' }}>
                                            {product.is_active ? <XCircle size={16} color="#ef4444" /> : <CheckCircle size={16} color="#10b981" />}
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;
