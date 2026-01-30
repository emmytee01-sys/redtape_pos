import { X } from 'lucide-react';

interface CategoryModalProps {
    show: boolean;
    onClose: () => void;
    newCategory: string;
    setNewCategory: (val: string) => void;
    onSubmit: () => void;
}

const CategoryModal = ({ show, onClose, newCategory, setNewCategory, onSubmit }: CategoryModalProps) => {
    if (!show) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Create Category</h2>
                <input
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Category name"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}
                />
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem' }}>Cancel</button>
                    <button onClick={onSubmit} style={{ padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem' }}>Create</button>
                </div>
            </div>
        </div>
    );
};

export default CategoryModal;
