import { useEffect, useState } from 'react';
import { discountRequestService, DiscountRequest } from '../services/discountRequestService';
import { authService } from '../services/authService';
import {
    Check,
    X,
    MessageSquare,
    User as UserIcon,
    Clock,
    Filter,
    Search,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';

const DiscountRequests = () => {
    const [requests, setRequests] = useState<DiscountRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal for processing
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<DiscountRequest | null>(null);
    const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
    const [adminNotes, setAdminNotes] = useState('');

    const user = authService.getCurrentUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'manager';

    useEffect(() => {
        loadRequests();
    }, [statusFilter]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const filters = statusFilter === 'all' ? {} : { status: statusFilter };
            const data = await discountRequestService.getAll(filters);
            setRequests(data);
        } catch (error) {
            console.error('Failed to load discount requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessRequest = async () => {
        if (!selectedRequest) return;

        try {
            if (processAction === 'approve') {
                await discountRequestService.approve(selectedRequest.id, adminNotes);
                alert('Discount request approved successfully');
            } else {
                await discountRequestService.reject(selectedRequest.id, adminNotes);
                alert('Discount request rejected');
            }
            setShowProcessModal(false);
            setAdminNotes('');
            setSelectedRequest(null);
            loadRequests();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Operation failed');
        }
    };

    const filteredRequests = requests.filter(r =>
        r.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requested_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return { bg: '#d1fae5', color: '#065f46', icon: CheckCircle };
            case 'rejected': return { bg: '#fee2e2', color: '#991b1b', icon: XCircle };
            case 'pending': return { bg: '#fef3c7', color: '#92400e', icon: Clock };
            default: return { bg: '#f3f4f6', color: '#374151', icon: AlertCircle };
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h1>Access Denied</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Discount Requests</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Review and manage pending discount requests for orders</p>
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                gap: '1rem',
                background: 'var(--surface)',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
            }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search by Order #, Customer or Sales Rep..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 3rem',
                                border: '1px solid var(--border)',
                                borderRadius: '0.5rem',
                                background: 'var(--background)'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={18} color="var(--text-secondary)" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '0.75rem',
                                border: '1px solid var(--border)',
                                borderRadius: '0.5rem',
                                background: 'var(--background)',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="pending">Pending Only</option>
                            <option value="approved">Approved Only</option>
                            <option value="rejected">Rejected Only</option>
                            <option value="all">All Requests</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{
                background: 'var(--surface)',
                borderRadius: '0.75rem',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--border)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>Loading requests...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--background)', borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Order Info</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Sales Rep</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Discount</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Reason</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((request) => {
                                const status = getStatusColor(request.status);
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={request.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600' }}>{request.order_number}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{request.customer_name || 'Walk-in'}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                                <UserIcon size={14} color="var(--text-secondary)" />
                                                {request.requested_by_name}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(request.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600', color: '#dc2626' }}>-₦{Number(request.discount_amount).toFixed(2)}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Order: ₦{Number(request.order_total || 0).toFixed(2)}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', maxWidth: '250px' }}>
                                                <MessageSquare size={14} style={{ marginTop: '3px', flexShrink: 0 }} color="var(--text-secondary)" />
                                                <span style={{ fontSize: '0.875rem' }}>{request.reason}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.375rem',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                background: status.bg,
                                                color: status.color,
                                                fontWeight: '600'
                                            }}>
                                                <StatusIcon size={12} />
                                                {request.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                {request.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setProcessAction('approve');
                                                                setShowProcessModal(true);
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.375rem',
                                                                padding: '0.5rem 0.75rem',
                                                                background: '#10b981',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '0.375rem',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            <Check size={14} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setProcessAction('reject');
                                                                setShowProcessModal(true);
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.375rem',
                                                                padding: '0.5rem 0.75rem',
                                                                background: '#ef4444',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '0.375rem',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            <X size={14} />
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                                                        <div style={{ fontWeight: '500' }}>Processed by {request.reviewed_by_name}</div>
                                                        {request.admin_notes && <div style={{ fontStyle: 'italic' }}>"{request.admin_notes}"</div>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                {!loading && filteredRequests.length === 0 && (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p>No discount requests found matching your filters</p>
                    </div>
                )}
            </div>

            {/* Process Modal */}
            {showProcessModal && selectedRequest && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {processAction === 'approve' ? <CheckCircle color="#10b981" /> : <XCircle color="#ef4444" />}
                            {processAction === 'approve' ? 'Approve' : 'Reject'} Discount Request
                        </h2>

                        <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Request Details:</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <div>Order: <strong>{selectedRequest.order_number}</strong></div>
                                <div>Discount: <strong style={{ color: '#dc2626' }}>₦{Number(selectedRequest.discount_amount).toFixed(2)}</strong></div>
                                <div>Sales Rep: <strong>{selectedRequest.requested_by_name}</strong></div>
                                <div>Reason: <strong>{selectedRequest.reason}</strong></div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Admin Notes (Optional)</label>
                            <textarea
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                                placeholder="Add a note for the sales representative..."
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    height: '100px',
                                    resize: 'none',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    setShowProcessModal(false);
                                    setAdminNotes('');
                                }}
                                style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessRequest}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: processAction === 'approve' ? '#10b981' : '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Confirm {processAction === 'approve' ? 'Approval' : 'Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscountRequests;
