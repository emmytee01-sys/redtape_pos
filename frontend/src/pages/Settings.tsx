import { useEffect, useState } from 'react';
import { settingsService, AccountNumber, POSTerminal, SystemSettings } from '../services/settingsService';
import { Plus, Edit, Trash2, Save, Upload, X, CreditCard, FileText, Image, Tablet } from 'lucide-react';

const Settings = () => {
  const [accountNumbers, setAccountNumbers] = useState<AccountNumber[]>([]);
  const [posTerminals, setPOSTerminals] = useState<POSTerminal[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({ receipt_name: '', logo_path: '', store_address: '', store_phone: '' });
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPOSModal, setShowPOSModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountNumber | null>(null);
  const [editingPOS, setEditingPOS] = useState<POSTerminal | null>(null);
  const [accountForm, setAccountForm] = useState({
    account_number: '',
    account_name: '',
    bank_name: '',
  });
  const [posForm, setPOSForm] = useState({
    bank_name: '',
    terminal_id: '',
  });
  const [receiptName, setReceiptName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accounts, terminals, systemSettings] = await Promise.all([
        settingsService.getAccountNumbers(),
        settingsService.getPOSTerminals(),
        settingsService.getSettings(),
      ]);
      setAccountNumbers(accounts);
      setPOSTerminals(terminals);
      setSettings(systemSettings);
      setReceiptName(systemSettings.receipt_name || '');
      setStoreAddress(systemSettings.store_address || '');
      setStorePhone(systemSettings.store_phone || '');
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!accountForm.account_number || !accountForm.account_name || !accountForm.bank_name) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (editingAccount) {
        await settingsService.updateAccountNumber(editingAccount.id, accountForm);
      } else {
        await settingsService.createAccountNumber(accountForm);
      }
      loadData();
      setShowAccountModal(false);
      setEditingAccount(null);
      setAccountForm({ account_number: '', account_name: '', bank_name: '' });
      alert(editingAccount ? 'Account updated successfully' : 'Account created successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save account');
    }
  };

  const handleEditAccount = (account: AccountNumber) => {
    setEditingAccount(account);
    setAccountForm({
      account_number: account.account_number,
      account_name: account.account_name,
      bank_name: account.bank_name,
    });
    setShowAccountModal(true);
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account number?')) return;

    try {
      await settingsService.deleteAccountNumber(id);
      loadData();
      alert('Account deleted successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete account');
    }
  };

  const handleCreatePOS = async () => {
    if (!posForm.bank_name || !posForm.terminal_id) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (editingPOS) {
        await settingsService.updatePOSTerminal(editingPOS.id, posForm);
      } else {
        await settingsService.createPOSTerminal(posForm);
      }
      loadData();
      setShowPOSModal(false);
      setEditingPOS(null);
      setPOSForm({ bank_name: '', terminal_id: '' });
      alert(editingPOS ? 'POS terminal updated successfully' : 'POS terminal created successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save POS terminal');
    }
  };

  const handleEditPOS = (pos: POSTerminal) => {
    setEditingPOS(pos);
    setPOSForm({
      bank_name: pos.bank_name,
      terminal_id: pos.terminal_id,
    });
    setShowPOSModal(true);
  };

  const handleDeletePOS = async (id: number) => {
    if (!confirm('Are you sure you want to delete this POS terminal?')) return;

    try {
      await settingsService.deletePOSTerminal(id);
      loadData();
      alert('POS terminal deleted successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete POS terminal');
    }
  };

  const handleSaveReceiptName = async () => {
    try {
      await settingsService.updateSetting('receipt_name', receiptName);
      setSettings({ ...settings, receipt_name: receiptName });
      alert('Receipt info saved successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save receipt name');
    }
  };

  const handleSaveStoreDetails = async () => {
    try {
      await Promise.all([
        settingsService.updateSetting('store_address', storeAddress),
        settingsService.updateSetting('store_phone', storePhone)
      ]);
      setSettings({ ...settings, store_address: storeAddress, store_phone: storePhone });
      alert('Store details saved successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save store details');
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      alert('Please select a logo file');
      return;
    }

    setUploading(true);
    try {
      const result = await settingsService.uploadLogo(logoFile);
      setSettings({ ...settings, logo_path: result.logo_path });
      setLogoFile(null);
      alert('Logo uploaded successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Settings</h1>

      {/* Account Numbers Section */}
      <div
        style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={24} color="#dc2626" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Account Numbers</h2>
          </div>
          <button
            onClick={() => {
              setEditingAccount(null);
              setAccountForm({ account_number: '', account_name: '', bank_name: '' });
              setShowAccountModal(true);
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
            Add Account Number
          </button>
        </div>

        {accountNumbers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <CreditCard size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No account numbers added yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {accountNumbers.map((account) => (
              <div
                key={account.id}
                style={{
                  padding: '1.5rem',
                  background: 'var(--background)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Account Number
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{account.account_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Account Name
                      </div>
                      <div style={{ fontWeight: '600' }}>{account.account_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Bank Name
                      </div>
                      <div style={{ fontWeight: '600' }}>{account.bank_name}</div>
                    </div>
                    <div>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: account.is_active ? '#d1fae5' : '#fee2e2',
                          color: account.is_active ? '#065f46' : '#991b1b',
                          fontWeight: '500',
                        }}
                      >
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEditAccount(account)}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Edit"
                  >
                    <Edit size={16} color="#2563eb" />
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POS Terminals Section */}
      <div
        style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Tablet size={24} color="#dc2626" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>POS Terminals</h2>
          </div>
          <button
            onClick={() => {
              setEditingPOS(null);
              setPOSForm({ bank_name: '', terminal_id: '' });
              setShowPOSModal(true);
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
            Add POS Terminal
          </button>
        </div>

        {posTerminals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <Tablet size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No POS terminals added yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {posTerminals.map((pos) => (
              <div
                key={pos.id}
                style={{
                  padding: '1.5rem',
                  background: 'var(--background)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Bank Name
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{pos.bank_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Terminal ID/Last 4 Digits
                      </div>
                      <div style={{ fontWeight: '600' }}>{pos.terminal_id}</div>
                    </div>
                    <div>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: pos.is_active ? '#d1fae5' : '#fee2e2',
                          color: pos.is_active ? '#065f46' : '#991b1b',
                          fontWeight: '500',
                        }}
                      >
                        {pos.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEditPOS(pos)}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Edit"
                  >
                    <Edit size={16} color="#2563eb" />
                  </button>
                  <button
                    onClick={() => handleDeletePOS(pos.id)}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt & Store Details Section */}
      <div
        style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <FileText size={24} color="#dc2626" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Receipt & Store Details</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              Business/Receipt Name
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="text"
                value={receiptName}
                onChange={(e) => setReceiptName(e.target.value)}
                placeholder="Enter receipt name"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
              <button
                onClick={handleSaveReceiptName}
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
                <Save size={18} />
                Save
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              Store Address
            </label>
            <textarea
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              placeholder="Enter store address"
              rows={2}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              Store Phone Number
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="Enter store phone"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
              <button
                onClick={handleSaveStoreDetails}
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
                <Save size={18} />
                Save Store Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div
        style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Image size={24} color="#dc2626" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Logo</h2>
        </div>
        {settings.logo_path && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Current Logo:
            </div>
            <img
              src={`http://localhost:3000${settings.logo_path}`}
              alt="Current Logo"
              style={{
                maxWidth: '200px',
                maxHeight: '100px',
                objectFit: 'contain',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                background: 'white',
              }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              fontSize: '1rem',
            }}
          />
          <button
            onClick={handleUploadLogo}
            disabled={!logoFile || uploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: !logoFile || uploading ? 'var(--text-secondary)' : '#dc2626',
              color: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: !logoFile || uploading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            <Upload size={18} />
            {uploading ? 'Uploading...' : 'Upload Logo'}
          </button>
        </div>
        {logoFile && (
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Selected: {logoFile.name}
          </div>
        )}
      </div>

      {/* Add/Edit Account Modal */}
      {showAccountModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowAccountModal(false);
            setEditingAccount(null);
            setAccountForm({ account_number: '', account_name: '', bank_name: '' });
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {editingAccount ? 'Edit Account Number' : 'Add Account Number'}
              </h2>
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setEditingAccount(null);
                  setAccountForm({ account_number: '', account_name: '', bank_name: '' });
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Account Number *
                </label>
                <input
                  type="text"
                  value={accountForm.account_number}
                  onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                  placeholder="e.g., 1234567890"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Account Name *
                </label>
                <input
                  type="text"
                  value={accountForm.account_name}
                  onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                  placeholder="e.g., Store Account"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={accountForm.bank_name}
                  onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                  placeholder="e.g., First Bank"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setEditingAccount(null);
                  setAccountForm({ account_number: '', account_name: '', bank_name: '' });
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAccount}
                disabled={!accountForm.account_number || !accountForm.account_name || !accountForm.bank_name}
                style={{
                  padding: '0.75rem 1.5rem',
                  background:
                    !accountForm.account_number || !accountForm.account_name || !accountForm.bank_name
                      ? 'var(--text-secondary)'
                      : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor:
                    !accountForm.account_number || !accountForm.account_name || !accountForm.bank_name
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: '500',
                }}
              >
                {editingAccount ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit POS Modal */}
      {showPOSModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowPOSModal(false);
            setEditingPOS(null);
            setPOSForm({ bank_name: '', terminal_id: '' });
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {editingPOS ? 'Edit POS Terminal' : 'Add POS Terminal'}
              </h2>
              <button
                onClick={() => {
                  setShowPOSModal(false);
                  setEditingPOS(null);
                  setPOSForm({ bank_name: '', terminal_id: '' });
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={posForm.bank_name}
                  onChange={(e) => setPOSForm({ ...posForm, bank_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                  placeholder="e.g., Zenith Bank"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Terminal ID/Last 4 Digits *
                </label>
                <input
                  type="text"
                  value={posForm.terminal_id}
                  onChange={(e) => setPOSForm({ ...posForm, terminal_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                  placeholder="e.g., 4321"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowPOSModal(false);
                  setEditingPOS(null);
                  setPOSForm({ bank_name: '', terminal_id: '' });
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePOS}
                disabled={!posForm.bank_name || !posForm.terminal_id}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !posForm.bank_name || !posForm.terminal_id ? 'var(--text-secondary)' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: !posForm.bank_name || !posForm.terminal_id ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                {editingPOS ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

