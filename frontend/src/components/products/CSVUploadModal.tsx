import { X, Upload as UploadIcon } from 'lucide-react';

interface CSVUploadModalProps {
    show: boolean;
    onClose: () => void;
    onUpload: (file: File) => void;
    uploading: boolean;
}

const CSVUploadModal = ({ show, onClose, onUpload, uploading }: CSVUploadModalProps) => {
    if (!show) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '500px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Upload Products</h2>
                <div style={{ border: '2px dashed var(--border)', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                    <UploadIcon size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <input type="file" accept=".csv,.xlsx" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem' }}>Cancel</button>
                    <button disabled={uploading} style={{ padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem' }}>
                        {uploading ? 'Uploading...' : 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CSVUploadModal;
