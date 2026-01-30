import { useEffect, useState } from 'react';
import { vendorService, Vendor, VendorInvoice } from '../services/vendorService';
import { productService, Product } from '../services/productService';
import {
    Plus,
    Upload,
    FileText,
    Link as LinkIcon,
    Edit,
    Trash2,
    Search,
    Package,
    Clock,
    AlertCircle,
    X,
} from 'lucide-react';

const Vendors = () => {
    const [activeTab, setActiveTab] = useState<'vendors' | 'invoices'>('vendors');
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    // Selection
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<VendorInvoice | null>(null);

    // Form Data
    const [vendorFormData, setVendorFormData] = useState<Partial<Vendor>>({
        vendor_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'Nigeria',
        notes: ''
    });

    const [linkFormData, setLinkFormData] = useState({
        product_id: 0,
        vendor_sku: '',
        unit_price: 0,
        minimum_order_quantity: 1,
        lead_time_days: 7,
        is_primary_supplier: false
    });

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'vendors') {
                const data = await vendorService.getAll();
                setVendors(data);
                const productData = await productService.getAll();
                setProducts(productData);
            } else {
                const data = await vendorService.getAllInvoices();
                setInvoices(data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdateVendor = async () => {
        try {
            if (selectedVendor) {
                await vendorService.update(selectedVendor.id, vendorFormData);
            } else {
                await vendorService.create(vendorFormData);
            }
            setShowVendorModal(false);
            resetVendorForm();
            loadData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save vendor');
        }
    };

    const handleDeleteVendor = async () => {
        if (!selectedVendor) return;
        try {
            await vendorService.delete(selectedVendor.id);
            setShowDeleteModal(false);
            setSelectedVendor(null);
            loadData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to delete vendor');
        }
    };

    const handleLinkProduct = async () => {
        if (!selectedVendor || !linkFormData.product_id) {
            alert('Please select a product');
            return;
        }
        try {
            await vendorService.linkProduct(selectedVendor.id, linkFormData.product_id, linkFormData);
            setShowLinkModal(false);
            alert('Product linked successfully');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to link product');
        }
    };

    const handleGenerateInvoices = async () => {
        if (confirm('This will generate purchase invoices for all out-of-stock products linked to their primary vendors. Continue?')) {
            try {
                const vendorIds = vendors.map(v => v.id);
                if (vendorIds.length === 0) {
                    alert('No vendors available');
                    return;
                }
                await vendorService.generateOutOfStockInvoice(vendorIds);
                alert('Invoices generated successfully');
                if (activeTab === 'invoices') loadData();
                else setActiveTab('invoices');
            } catch (error: any) {
                alert(error.response?.data?.error || 'Failed to generate invoices');
            }
        }
    };

    const resetVendorForm = () => {
        setVendorFormData({
            vendor_name: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            country: 'Nigeria',
            notes: ''
        });
        setSelectedVendor(null);
    };

    const filteredVendors = vendors.filter(v =>
        v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return { bg: '#d1fae5', color: '#065f46' };
            case 'sent': return { bg: '#dbeafe', color: '#1e40af' };
            case 'cancelled': return { bg: '#fee2e2', color: '#991b1b' };
            default: return { bg: '#f3f4f6', color: '#374151' };
        }
    };

    if (loading && vendors.length === 0 && invoices.length === 0) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Supply Management</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage vendors, product sourcing, and purchase orders</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            fontWeight: '500',
                        }}
                    >
                        <Upload size={18} />
                        Import
                    </button>
                    <button
                        onClick={() => {
                            resetVendorForm();
                            setShowVendorModal(true);
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
                            fontWeight: '500',
                        }}
                    >
                        <Plus size={18} />
                        Add Vendor
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
                <button
                    onClick={() => setActiveTab('vendors')}
                    style={{
                        padding: '1rem 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'vendors' ? '2px solid #dc2626' : '2px solid transparent',
                        color: activeTab === 'vendors' ? '#dc2626' : 'var(--text-secondary)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Vendors
                </button>
                <button
                    onClick={() => setActiveTab('invoices')}
                    style={{
                        padding: '1rem 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'invoices' ? '2px solid #dc2626' : '2px solid transparent',
                        color: activeTab === 'invoices' ? '#dc2626' : 'var(--text-secondary)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Purchase Orders
                </button>
            </div>

            {activeTab === 'vendors' ? (
                <>
                    {/* Vendors Content */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem',
                        gap: '1rem'
                    }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    background: 'var(--surface)'
                                }}
                            />
                        </div>
                        <button
                            onClick={handleGenerateInvoices}
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
                            <FileText size={18} />
                            Auto-Generate POs
                        </button>
                    </div>

                    <div style={{
                        background: 'var(--surface)',
                        borderRadius: '0.75rem',
                        boxShadow: 'var(--shadow)',
                        border: '1px solid var(--border)',
                        overflow: 'hidden'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--background)', borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Vendor Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Contact</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Location</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVendors.map((vendor) => (
                                    <tr key={vendor.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600' }}>{vendor.vendor_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Added {new Date(vendor.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem' }}>{vendor.contact_person || 'N/A'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{vendor.email}</div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {vendor.city}, {vendor.state}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                background: vendor.is_active ? '#d1fae5' : '#fee2e2',
                                                color: vendor.is_active ? '#065f46' : '#991b1b',
                                                fontWeight: '600'
                                            }}>
                                                {vendor.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => {
                                                        setSelectedVendor(vendor);
                                                        setShowLinkModal(true);
                                                    }}
                                                    style={{ padding: '0.5rem', color: '#2563eb', borderRadius: '0.375rem', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}
                                                    title="Link Products"
                                                >
                                                    <LinkIcon size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedVendor(vendor);
                                                        setVendorFormData(vendor);
                                                        setShowVendorModal(true);
                                                    }}
                                                    style={{ padding: '0.5rem', color: '#f59e0b', borderRadius: '0.375rem', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}
                                                    title="Edit Vendor"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedVendor(vendor);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    style={{ padding: '0.5rem', color: '#ef4444', borderRadius: '0.375rem', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}
                                                    title="Delete Vendor"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredVendors.length === 0 && (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                <p>No vendors found</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Purchase Invoices Content */}
                    <div style={{
                        background: 'var(--surface)',
                        borderRadius: '0.75rem',
                        boxShadow: 'var(--shadow)',
                        border: '1px solid var(--border)',
                        overflow: 'hidden'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--background)', borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>PO Number</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Vendor</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => {
                                    const status = getStatusColor(invoice.status);
                                    return (
                                        <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: '600' }}>{invoice.invoice_number}</td>
                                            <td style={{ padding: '1rem' }}>{invoice.vendor_name}</td>
                                            <td style={{ padding: '1rem', fontWeight: '600' }}>₦{Number(invoice.total_amount).toFixed(2)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    background: status.bg,
                                                    color: status.color,
                                                    fontWeight: '600'
                                                }}>
                                                    {invoice.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                                {new Date(invoice.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={async () => {
                                                            const fullInvoice = await vendorService.getInvoice(invoice.id);
                                                            setSelectedInvoice(fullInvoice);
                                                            setShowInvoiceModal(true);
                                                        }}
                                                        style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid var(--border)', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {invoices.length === 0 && (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                <p>No purchase orders found</p>
                                <button
                                    onClick={handleGenerateInvoices}
                                    style={{ marginTop: '1rem', color: '#2563eb', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Generate from out-of-stock items
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Vendor Modal */}
            {showVendorModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Vendor Name *</label>
                                <input
                                    value={vendorFormData.vendor_name}
                                    onChange={e => setVendorFormData({ ...vendorFormData, vendor_name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Contact Person</label>
                                <input
                                    value={vendorFormData.contact_person || ''}
                                    onChange={e => setVendorFormData({ ...vendorFormData, contact_person: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
                                <input
                                    type="email"
                                    value={vendorFormData.email || ''}
                                    onChange={e => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Phone</label>
                                <input
                                    value={vendorFormData.phone || ''}
                                    onChange={e => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>City</label>
                                <input
                                    value={vendorFormData.city || ''}
                                    onChange={e => setVendorFormData({ ...vendorFormData, city: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Address</label>
                                <textarea
                                    value={vendorFormData.address || ''}
                                    onChange={e => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', height: '80px' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={() => setShowVendorModal(false)} style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateOrUpdateVendor} style={{ padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Save Vendor</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Product Modal */}
            {showLinkModal && selectedVendor && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Link Product to {selectedVendor.vendor_name}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Select Product *</label>
                                <select
                                    onChange={e => setLinkFormData({ ...linkFormData, product_id: parseInt(e.target.value) })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                >
                                    <option value="">Select a product...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.product_name} ({p.sku})</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Cost Price (₦)</label>
                                    <input
                                        type="number"
                                        value={linkFormData.unit_price}
                                        onChange={e => setLinkFormData({ ...linkFormData, unit_price: parseFloat(e.target.value) })}
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Min Order Qty</label>
                                    <input
                                        type="number"
                                        value={linkFormData.minimum_order_quantity}
                                        onChange={e => setLinkFormData({ ...linkFormData, minimum_order_quantity: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="primary"
                                    checked={linkFormData.is_primary_supplier}
                                    onChange={e => setLinkFormData({ ...linkFormData, is_primary_supplier: e.target.checked })}
                                />
                                <label htmlFor="primary" style={{ fontSize: '0.875rem' }}>Set as Primary Supplier</label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={() => setShowLinkModal(false)} style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleLinkProduct} style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Link Product</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Detail Modal */}
            {showInvoiceModal && selectedInvoice && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', color: '#111827' }}>Purchase Order</h2>
                                <p style={{ color: '#6b7280' }}>#{selectedInvoice.invoice_number}</p>
                            </div>
                            <button onClick={() => setShowInvoiceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Vendor Details</h3>
                                <p style={{ fontWeight: '600' }}>{selectedInvoice.vendor_name}</p>
                                <p style={{ fontSize: '0.875rem' }}>Status: {selectedInvoice.status}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Order Date</h3>
                                <p>{new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem' }}>Item</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem' }}>Qty</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem' }}>Unit Price</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedInvoice.items?.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <p style={{ fontWeight: '500' }}>{item.product_name}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>SKU: {item.sku}</p>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>{item.quantity}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>₦{Number(item.unit_price).toFixed(2)}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>₦{Number(item.total_price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} style={{ padding: '1.5rem 1rem', textAlign: 'right', fontWeight: '600', fontSize: '1.125rem' }}>Total Amount</td>
                                    <td style={{ padding: '1.5rem 1rem', textAlign: 'right', fontWeight: '700', fontSize: '1.125rem', color: '#dc2626' }}>₦{Number(selectedInvoice.total_amount).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => window.print()}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'white', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                Print PO
                            </button>
                            <button
                                onClick={() => alert('Feature to send email to vendor coming soon!')}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                Send to Vendor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ marginBottom: '0.5rem' }}>Delete Vendor?</h2>
                        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Are you sure you want to delete <strong>{selectedVendor?.vendor_name}</strong>? This will remove all associated product links.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleDeleteVendor} style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Import Vendors</h2>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Upload a CSV or Excel file containing vendor details. Expected columns: Vendor Name, Contact Person, Email, Phone, City, State.</p>

                        <div style={{ border: '2px dashed var(--border)', padding: '3rem', borderRadius: '0.75rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                            <input
                                type="file"
                                id="vendorFile"
                                accept=".csv,.xlsx,.xls"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                        try {
                                            await vendorService.uploadCSV(e.target.files[0]);
                                            alert('Import successful!');
                                            setShowUploadModal(false);
                                            loadData();
                                        } catch (error: any) {
                                            alert(error.response?.data?.error || 'Import failed');
                                        }
                                    }
                                }}
                            />
                            <label htmlFor="vendorFile" style={{ cursor: 'pointer' }}>
                                <Upload size={32} color="#6b7280" style={{ marginBottom: '0.5rem' }} />
                                <p style={{ fontWeight: '600' }}>Click to upload file</p>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>CSV or Excel (Max 5MB)</p>
                            </label>
                        </div>

                        <button onClick={() => setShowUploadModal(false)} style={{ width: '100%', padding: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendors;
