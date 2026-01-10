import { useEffect, useState } from 'react';
import { productService, Product } from '../services/productService';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { vendorService, Vendor, VendorInvoice } from '../services/vendorService';
import { Plus, Upload, Search, Package, CheckCircle, XCircle, Edit, FolderPlus, Download, Eye, Filter, X, ShoppingCart, Minus, Trash2, Building2, FileText } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [productForm, setProductForm] = useState({
    sku: '',
    product_name: '',
    category: '',
    description: '',
    price: '',
    quantity: '',
    min_stock_level: '',
  });
  const user = authService.getCurrentUser();
  const canManage = user?.role === 'manager' || user?.role === 'admin';
  const isSalesRep = user?.role === 'sales_rep';
  const [showPickItems, setShowPickItems] = useState(false);
  const [salesCart, setSalesCart] = useState<Array<{ product_id: number; product: Product; quantity: number }>>([]);
  const [pickItemsSearch, setPickItemsSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'vendors'>('products');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorsForProduct, setSelectedVendorsForProduct] = useState<number[]>([]);
  const [vendorPrices, setVendorPrices] = useState<Record<number, string>>({});

  useEffect(() => {
    loadProducts();
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const data = await vendorService.getAll();
      setVendors(data);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

  useEffect(() => {
    // Extract unique categories from products
    const uniqueCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    setCategories(uniqueCategories);
  }, [products]);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll(true);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) return;

    setUploading(true);
    try {
      const result = await productService.uploadCSV(csvFile);
      alert(`Import completed: ${result.success} successful, ${result.failed} failed`);
      if (result.success > 0) {
        loadProducts();
        setShowCSVModal(false);
        setCsvFile(null);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      const product = await productService.create({
        sku: productForm.sku,
        product_name: productForm.product_name,
        category: productForm.category || 'Uncategorized',
        description: productForm.description || undefined,
        price: parseFloat(productForm.price),
        quantity: parseInt(productForm.quantity),
        min_stock_level: parseInt(productForm.min_stock_level) || 0,
      });
      
      // Link vendors to product
      for (const vendorId of selectedVendorsForProduct) {
        const price = vendorPrices[vendorId];
        try {
          await vendorService.linkProduct(vendorId, product.id, {
            unit_price: price ? parseFloat(price) : undefined,
          });
        } catch (error) {
          console.error(`Failed to link vendor ${vendorId}:`, error);
        }
      }
      
      loadProducts();
      setShowModal(false);
      resetForm();
      setSelectedVendorsForProduct([]);
      setVendorPrices({});
      alert('Product created successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      await productService.update(editingProduct.id, {
        sku: productForm.sku,
        product_name: productForm.product_name,
        category: productForm.category || 'Uncategorized',
        description: productForm.description || undefined,
        price: parseFloat(productForm.price),
        quantity: parseInt(productForm.quantity),
        min_stock_level: parseInt(productForm.min_stock_level) || 0,
      });
      
      // Update vendor links
      // First, get existing vendor links
      const existingVendors = await vendorService.getProductVendors(editingProduct.id);
      const selectedVendorIds = new Set(selectedVendorsForProduct);
      
      // Remove unselected vendors
      for (const existingVendor of existingVendors) {
        if (!selectedVendorIds.has(existingVendor.vendor_id)) {
          await vendorService.unlinkProduct(existingVendor.vendor_id, editingProduct.id);
        }
      }
      
      // Add or update selected vendors
      for (const vendorId of selectedVendorsForProduct) {
        const price = vendorPrices[vendorId];
        try {
          await vendorService.linkProduct(vendorId, editingProduct.id, {
            unit_price: price ? parseFloat(price) : undefined,
          });
        } catch (error) {
          console.error(`Failed to link vendor ${vendorId}:`, error);
        }
      }
      
      loadProducts();
      setShowEditModal(false);
      setEditingProduct(null);
      resetForm();
      setSelectedVendorsForProduct([]);
      setVendorPrices({});
      alert('Product updated successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update product');
    }
  };

  const handleEditClick = async (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku,
      product_name: product.product_name,
      category: product.category || '',
      description: product.description || '',
      price: Number(product.price).toString(),
      quantity: product.quantity.toString(),
      min_stock_level: product.min_stock_level.toString(),
    });
    
    // Load existing vendor links
    try {
      const productVendors = await vendorService.getProductVendors(product.id);
      setSelectedVendorsForProduct(productVendors.map((pv) => pv.vendor_id));
      const prices: Record<number, string> = {};
      productVendors.forEach((pv) => {
        if (pv.unit_price) {
          prices[pv.vendor_id] = pv.unit_price.toString();
        }
      });
      setVendorPrices(prices);
    } catch (error) {
      console.error('Failed to load product vendors:', error);
    }
    
    setShowEditModal(true);
  };

  const resetForm = () => {
    setProductForm({
      sku: '',
      product_name: '',
      category: '',
      description: '',
      price: '',
      quantity: '',
      min_stock_level: '',
    });
  };

  const filteredProducts = products.filter((p) => {
    // Search filter
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category filter
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory || (!p.category && filterCategory === 'Uncategorized');

    // Status filter
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' && p.is_active) || (filterStatus === 'inactive' && !p.is_active);

    // Stock filter
    let matchesStock = true;
    if (filterStock === 'in_stock') matchesStock = p.quantity > 0;
    else if (filterStock === 'out_of_stock') matchesStock = p.quantity === 0;
    else if (filterStock === 'low_stock') matchesStock = p.quantity > 0 && p.quantity <= p.min_stock_level;

    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  const handleToggleSelect = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const handleBulkStatusToggle = async (activate: boolean) => {
    if (selectedProducts.length === 0) return;
    try {
      await Promise.all(
        selectedProducts.map((id) => productService.update(id, { is_active: activate }))
      );
      loadProducts();
      setSelectedProducts([]);
      alert(`Successfully ${activate ? 'activated' : 'deactivated'} ${selectedProducts.length} product(s)`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update products');
    }
  };

  const handleToggleProductStatus = async (product: Product) => {
    try {
      await productService.update(product.id, { is_active: !product.is_active });
      loadProducts();
      alert(`Product ${product.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update product');
    }
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'Description', 'Price', 'Quantity', 'Min Stock Level', 'Status'];
    const rows = filteredProducts.map((p) => [
      p.sku,
      p.product_name,
      p.category || 'Uncategorized',
      p.description || '',
      Number(p.price).toString(),
      p.quantity.toString(),
      p.min_stock_level.toString(),
      p.is_active ? 'Active' : 'Inactive',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate stats
  const totalProducts = products.length;
  const inStock = products.filter((p) => p.quantity > 0 && p.is_active).length;
  const outOfStock = products.filter((p) => p.quantity === 0 && p.is_active).length;

  // Sales Rep specific functions
  const addToSalesCart = (product: Product) => {
    if (product.quantity === 0) {
      alert('This product is out of stock');
      return;
    }
    const existing = salesCart.find((item) => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        alert('Cannot add more than available stock');
        return;
      }
      setSalesCart(salesCart.map((item) => (item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setSalesCart([...salesCart, { product_id: product.id, product, quantity: 1 }]);
    }
  };

  const updateSalesCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setSalesCart(salesCart.filter((item) => item.product_id !== productId));
    } else {
      const item = salesCart.find((item) => item.product_id === productId);
      if (item && quantity > item.product.quantity) {
        alert('Cannot add more than available stock');
        return;
      }
      setSalesCart(salesCart.map((item) => (item.product_id === productId ? { ...item, quantity } : item)));
    }
  };

  const removeFromSalesCart = (productId: number) => {
    setSalesCart(salesCart.filter((item) => item.product_id !== productId));
  };

  const calculateCartTotal = () => {
    return salesCart.reduce((total, item) => {
      return total + Number(item.product.price) * item.quantity;
    }, 0);
  };

  const filteredProductsForPick = products.filter(
    (p) =>
      p.is_active &&
      (p.product_name.toLowerCase().includes(pickItemsSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(pickItemsSearch.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(pickItemsSearch.toLowerCase())))
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  // Sales Rep View
  if (isSalesRep) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Products</h1>

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Total Products
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb' }}>{totalProducts}</p>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.5rem',
                  background: '#2563eb20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Package size={24} color="#2563eb" />
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  In Stock
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{inStock}</p>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.5rem',
                  background: '#10b98120',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={24} color="#10b981" />
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Out of Stock
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>{outOfStock}</p>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.5rem',
                  background: '#ef444420',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle size={24} color="#ef4444" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            marginBottom: '2rem',
          }}
        >
          <button
            onClick={() => setShowPickItems(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              background: '#dc2626',
              color: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ShoppingCart size={20} />
            Pick Items
          </button>
        </div>

        {/* Pick Items Modal - Full Screen */}
        {showPickItems && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              zIndex: 1000,
            }}
            onClick={() => {
              if (salesCart.length === 0) {
                setShowPickItems(false);
              }
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
                        setShowPickItems(false);
                        setSalesCart([]);
                        setPickItemsSearch('');
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

                {/* Search */}
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

                {/* Product Grid */}
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
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{product.category}</div>
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
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Minus size={16} />
                            </button>
                            <span style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateSalesCartQuantity(product.id, cartItem.quantity + 1)}
                              disabled={cartItem.quantity >= product.quantity}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: cartItem.quantity >= product.quantity ? '#9ca3af' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: cartItem.quantity >= product.quantity ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToSalesCart(product)}
                            disabled={product.quantity === 0}
                            style={{
                              padding: '0.5rem',
                              background: product.quantity === 0 ? '#9ca3af' : '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: product.quantity === 0 ? 'not-allowed' : 'pointer',
                              fontWeight: '500',
                              marginTop: '0.5rem',
                            }}
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
              <div
                style={{
                  width: '400px',
                  background: 'var(--background)',
                  borderLeft: '1px solid var(--border)',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Cart</h3>

                {salesCart.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Your cart is empty</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Search and add products</p>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem' }}>
                      {salesCart.map((item) => (
                        <div
                          key={item.product_id}
                          style={{
                            background: 'var(--surface)',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.product.product_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.product.sku}</div>
                            </div>
                            <button
                              onClick={() => removeFromSalesCart(item.product_id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                color: '#ef4444',
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button
                                onClick={() => updateSalesCartQuantity(item.product_id, item.quantity - 1)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <Minus size={14} />
                              </button>
                              <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: '600' }}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateSalesCartQuantity(item.product_id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.quantity}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  background: item.quantity >= item.product.quantity ? '#9ca3af' : '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  cursor: item.quantity >= item.product.quantity ? 'not-allowed' : 'pointer',
                                }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <div style={{ fontWeight: '600', color: '#dc2626' }}>
                              ₦{(Number(item.product.price) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart Total */}
                    <div
                      style={{
                        borderTop: '2px solid var(--border)',
                        paddingTop: '1.5rem',
                        marginBottom: '1.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>Total:</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
                          ₦{calculateCartTotal().toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          if (salesCart.length === 0) return;
                          try {
                            await orderService.create({
                              items: salesCart.map((item) => ({
                                product_id: item.product_id,
                                quantity: item.quantity,
                              })),
                            });
                            alert('Order created successfully!');
                            setSalesCart([]);
                            setShowPickItems(false);
                            setPickItemsSearch('');
                          } catch (error: any) {
                            alert(error.response?.data?.error || 'Failed to create order');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '1rem',
                        }}
                      >
                        Create Order
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin/Manager View (existing code)
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>Products Management</h1>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'products' ? '#dc2626' : 'transparent',
            color: activeTab === 'products' ? 'white' : 'var(--text)',
            border: 'none',
            borderBottom: activeTab === 'products' ? '3px solid #dc2626' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            marginBottom: '-2px',
          }}
        >
          Products
        </button>
        {canManage && (
          <button
            onClick={() => setActiveTab('vendors')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'vendors' ? '#dc2626' : 'transparent',
              color: activeTab === 'vendors' ? 'white' : 'var(--text)',
              border: 'none',
              borderBottom: activeTab === 'vendors' ? '3px solid #dc2626' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              marginBottom: '-2px',
            }}
          >
            Vendors
          </button>
        )}
      </div>

      {activeTab === 'vendors' ? (
        <VendorsTab />
      ) : (
        <>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Total Products
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb' }}>{totalProducts}</p>
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.5rem',
                background: '#2563eb20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={24} color="#2563eb" />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                In Stock
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{inStock}</p>
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.5rem',
                background: '#10b98120',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={24} color="#10b981" />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Out of Stock
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>{outOfStock}</p>
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.5rem',
                background: '#ef444420',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XCircle size={24} color="#ef4444" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
        {canManage && (
        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
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
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#b91c1c';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#dc2626';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={18} />
              Add Product
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
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
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e40af';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FolderPlus size={18} />
              Create Category
            </button>
            <button
              onClick={() => setShowCSVModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#10b981',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#059669';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10b981';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Upload size={18} />
              Upload CSV
            </button>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#7c3aed',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#6d28d9';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#7c3aed';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
          </div>
        )}

      {/* Filters and Bulk Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: showFilters ? '#dc2626' : 'var(--surface)',
              color: showFilters ? 'white' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            <Filter size={18} />
            Filters
          </button>
          {canManage && selectedProducts.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {selectedProducts.length} selected
              </span>
              <button
                onClick={() => handleBulkStatusToggle(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusToggle(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Deactivate
              </button>
              <button
                onClick={() => setSelectedProducts([])}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Filter Products</h3>
            <button
              onClick={() => {
                setFilterCategory('all');
                setFilterStatus('all');
                setFilterStock('all');
              }}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Clear All
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white',
                }}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Uncategorized">Uncategorized</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white',
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Stock Level
              </label>
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white',
                }}
              >
                <option value="all">All Stock</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="low_stock">Low Stock</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '500px' }}>
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              fontSize: '1rem',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <X size={18} color="var(--text-secondary)" />
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--background)', borderBottom: '2px solid var(--border)' }}>
              {canManage && (
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', width: '50px' }}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                SKU
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Product Name
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Category
              </th>
              <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Price
              </th>
              <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Quantity
              </th>
              <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Min Stock
              </th>
              <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Status
              </th>
              {canManage && (
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, index) => (
              <tr
                key={product.id}
                style={{
                  borderBottom: index < filteredProducts.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.2s',
                  background: selectedProducts.includes(product.id) ? '#fef3c7' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!selectedProducts.includes(product.id)) {
                    e.currentTarget.style.background = 'var(--background)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedProducts.includes(product.id)) {
                    e.currentTarget.style.background = 'transparent';
                  } else {
                    e.currentTarget.style.background = '#fef3c7';
                  }
                }}
              >
                {canManage && (
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleToggleSelect(product.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                )}
                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {product.sku}
                </td>
                <td
                  style={{
                    padding: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleViewDetails(product)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '';
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  {product.product_name}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      background: '#e0e7ff',
                      color: '#4338ca',
                      fontWeight: '500',
                    }}
                  >
                    {product.category || 'Uncategorized'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                  ₦{Number(product.price).toFixed(2)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span
                    style={{
                      color: product.quantity === 0 ? '#ef4444' : product.quantity <= product.min_stock_level ? '#f59e0b' : '#10b981',
                      fontWeight: product.quantity <= product.min_stock_level ? '600' : 'normal',
                    }}
                  >
                    {product.quantity}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {product.min_stock_level}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      background: product.is_active ? '#d1fae5' : '#fee2e2',
                      color: product.is_active ? '#065f46' : '#991b1b',
                      fontWeight: '500',
                    }}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {canManage && (
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewDetails(product)}
                        title="View Details"
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--background)';
                          e.currentTarget.style.borderColor = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        <Eye size={16} color="#2563eb" />
                      </button>
                      <button
                        onClick={() => handleEditClick(product)}
                        title="Edit Product"
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--background)';
                          e.currentTarget.style.borderColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        <Edit size={16} color="#dc2626" />
                      </button>
                      <button
                        onClick={() => handleToggleProductStatus(product)}
                        title={product.is_active ? 'Deactivate' : 'Activate'}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--background)';
                          e.currentTarget.style.borderColor = product.is_active ? '#ef4444' : '#10b981';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        {product.is_active ? (
                          <XCircle size={16} color="#ef4444" />
                        ) : (
                          <CheckCircle size={16} color="#10b981" />
                        )}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No products found</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showModal && (
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
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Add New Product</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  SKU *
                </label>
                <input
                  type="text"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                  placeholder="e.g., PROD-001"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productForm.product_name}
                  onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Category
                </label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    background: 'white',
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                  placeholder="Enter product description"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Price (₦) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  value={productForm.min_stock_level}
                  onChange={(e) => setProductForm({ ...productForm, min_stock_level: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                  placeholder="0"
                />
              </div>
            </div>
            
            {/* Vendor Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Vendors (Optional)
              </label>
              <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                {vendors.filter((v) => v.is_active).map((vendor) => (
                  <div key={vendor.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedVendorsForProduct.includes(vendor.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVendorsForProduct([...selectedVendorsForProduct, vendor.id]);
                          } else {
                            setSelectedVendorsForProduct(selectedVendorsForProduct.filter((id) => id !== vendor.id));
                            const newPrices = { ...vendorPrices };
                            delete newPrices[vendor.id];
                            setVendorPrices(newPrices);
                          }
                        }}
                      />
                      <span style={{ fontWeight: '500' }}>{vendor.vendor_name}</span>
                    </label>
                    {selectedVendorsForProduct.includes(vendor.id) && (
                      <div style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Unit Price (₦)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={vendorPrices[vendor.id] || ''}
                          onChange={(e) => setVendorPrices({ ...vendorPrices, [vendor.id]: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            marginTop: '0.25rem',
                          }}
                          placeholder="Vendor price (optional)"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {vendors.filter((v) => v.is_active).length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No active vendors available</p>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
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
                onClick={handleCreateProduct}
                disabled={!productForm.sku || !productForm.product_name || !productForm.price || !productForm.quantity}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !productForm.sku || !productForm.product_name || !productForm.price || !productForm.quantity ? 'var(--text-secondary)' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: !productForm.sku || !productForm.product_name || !productForm.price || !productForm.quantity ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                Create Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
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
            setShowEditModal(false);
            setEditingProduct(null);
            resetForm();
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Edit Product</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  SKU *
                </label>
                <input
                  type="text"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productForm.product_name}
                  onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Category
                </label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    background: 'white',
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Price (₦) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  value={productForm.min_stock_level}
                  onChange={(e) => setProductForm({ ...productForm, min_stock_level: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                  resetForm();
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
                onClick={handleUpdateProduct}
                disabled={!productForm.sku || !productForm.product_name || !productForm.price || !productForm.quantity}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !productForm.sku || !productForm.product_name || !productForm.price || !productForm.quantity ? 'var(--text-secondary)' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: !productForm.sku || !productForm.product_name || !productForm.price || !productForm.quantity ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
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
            setShowCategoryModal(false);
            setNewCategory('');
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Create Category</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Categories will be available when creating or editing products.
            </p>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Category Name
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g., Electronics, Clothing, Food"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  marginBottom: '1.5rem',
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newCategory.trim()) {
                    if (!categories.includes(newCategory.trim())) {
                      setCategories([...categories, newCategory.trim()]);
                      setNewCategory('');
                      setShowCategoryModal(false);
                      alert('Category created successfully!');
                    } else {
                      alert('Category already exists');
                    }
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory('');
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
                onClick={() => {
                  if (newCategory.trim()) {
                    if (!categories.includes(newCategory.trim())) {
                      setCategories([...categories, newCategory.trim()]);
                      setNewCategory('');
                      setShowCategoryModal(false);
                      alert('Category created successfully!');
                    } else {
                      alert('Category already exists');
                    }
                  }
                }}
                disabled={!newCategory.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !newCategory.trim() ? 'var(--text-secondary)' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: !newCategory.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVModal && (
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
            setShowCSVModal(false);
            setCsvFile(null);
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Upload Products</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Upload a CSV or Excel file (XLSX) with product data. Supported columns: product_name, sku, category, price, quantity, min_stock_level (optional)
            </p>
            <div
              style={{
                padding: '1.5rem',
                border: '2px dashed var(--border)',
                borderRadius: '0.5rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
                background: 'var(--background)',
              }}
            >
              <Upload size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
              {csvFile && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Selected: {csvFile.name}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCSVModal(false);
                  setCsvFile(null);
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
                onClick={handleCSVUpload}
                disabled={!csvFile || uploading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: uploading || !csvFile ? 'var(--text-secondary)' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: uploading || !csvFile ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
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
            setShowDetailsModal(false);
            setSelectedProduct(null);
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Product Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProduct(null);
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
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  SKU
                </label>
                <p style={{ fontSize: '1rem', fontFamily: 'monospace' }}>{selectedProduct.sku}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Product Name
                </label>
                <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>{selectedProduct.product_name}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Category
                </label>
                <span
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    background: '#e0e7ff',
                    color: '#4338ca',
                    fontWeight: '500',
                    display: 'inline-block',
                  }}
                >
                  {selectedProduct.category || 'Uncategorized'}
                </span>
              </div>
              {selectedProduct.description && (
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Description
                  </label>
                  <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>{selectedProduct.description}</p>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Price
                  </label>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#dc2626' }}>
                    ₦{Number(selectedProduct.price).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Quantity
                  </label>
                  <p
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color:
                        selectedProduct.quantity === 0
                          ? '#ef4444'
                          : selectedProduct.quantity <= selectedProduct.min_stock_level
                          ? '#f59e0b'
                          : '#10b981',
                    }}
                  >
                    {selectedProduct.quantity}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Min Stock Level
                  </label>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{selectedProduct.min_stock_level}</p>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Status
                </label>
                <span
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    background: selectedProduct.is_active ? '#d1fae5' : '#fee2e2',
                    color: selectedProduct.is_active ? '#065f46' : '#991b1b',
                    fontWeight: '500',
                    display: 'inline-block',
                  }}
                >
                  {selectedProduct.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Created At
                </label>
                <p style={{ fontSize: '0.875rem' }}>
                  {new Date(selectedProduct.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            {canManage && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditClick(selectedProduct);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Edit Product
                </button>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

// Vendors Tab Component
const VendorsTab = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorFile, setVendorFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [_invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [vendorForm, setVendorForm] = useState({
    vendor_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    notes: '',
  });

  useEffect(() => {
    loadVendors();
    loadInvoices();
  }, []);

  const loadVendors = async () => {
    try {
      const data = await vendorService.getAll();
      setVendors(data);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await vendorService.getAllInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const handleCreateVendor = async () => {
    if (!vendorForm.vendor_name.trim()) {
      alert('Vendor name is required');
      return;
    }

    try {
      if (editingVendor) {
        await vendorService.update(editingVendor.id, vendorForm);
        alert('Vendor updated successfully');
      } else {
        await vendorService.create(vendorForm);
        alert('Vendor created successfully');
      }
      loadVendors();
      setShowModal(false);
      setShowEditModal(false);
      setEditingVendor(null);
      setVendorForm({
        vendor_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        notes: '',
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save vendor');
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      vendor_name: vendor.vendor_name,
      contact_person: vendor.contact_person || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      country: vendor.country || '',
      notes: vendor.notes || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteVendor = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await vendorService.delete(id);
      alert('Vendor deleted successfully');
      loadVendors();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete vendor');
    }
  };

  const handleUploadVendors = async () => {
    if (!vendorFile) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const result = await vendorService.uploadCSV(vendorFile);
      alert(`Upload completed: ${result.success} successful, ${result.failed} failed`);
      loadVendors();
      setShowUploadModal(false);
      setVendorFile(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload vendors');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (selectedVendors.length === 0) {
      alert('Please select at least one vendor');
      return;
    }

    try {
      const result = await vendorService.generateOutOfStockInvoice(selectedVendors);
      alert(`Generated ${result.invoices.length} invoice(s) successfully`);
      loadInvoices();
      setShowInvoiceModal(false);
      setSelectedVendors([]);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to generate invoices');
    }
  };

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.is_active).length;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Total Vendors
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb' }}>{totalVendors}</p>
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.5rem',
                background: '#2563eb20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={24} color="#2563eb" />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Active Vendors
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{activeVendors}</p>
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.5rem',
                background: '#10b98120',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={24} color="#10b981" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: 'var(--surface)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setEditingVendor(null);
              setVendorForm({
                vendor_name: '',
                contact_person: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                country: '',
                notes: '',
              });
              setShowModal(true);
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
          <button
            onClick={() => setShowUploadModal(true)}
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
            <Upload size={18} />
            Upload Vendors
          </button>
          <button
            onClick={() => setShowInvoiceModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            <FileText size={18} />
            Generate Invoice (Out of Stock)
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div
        style={{
          background: 'var(--surface)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Vendor Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Contact Person</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Phone</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>City</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>{vendor.vendor_name}</td>
                  <td style={{ padding: '0.75rem' }}>{vendor.contact_person || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{vendor.email || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{vendor.phone || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{vendor.city || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        background: vendor.is_active ? '#d1fae5' : '#fee2e2',
                        color: vendor.is_active ? '#065f46' : '#991b1b',
                        fontWeight: '500',
                      }}
                    >
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditVendor(vendor)}
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
                        onClick={() => handleDeleteVendor(vendor.id)}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showModal && (
        <VendorModal
          vendorForm={vendorForm}
          setVendorForm={setVendorForm}
          onSave={handleCreateVendor}
          onClose={() => {
            setShowModal(false);
            setVendorForm({
              vendor_name: '',
              contact_person: '',
              email: '',
              phone: '',
              address: '',
              city: '',
              state: '',
              country: '',
              notes: '',
            });
          }}
          title="Add Vendor"
        />
      )}

      {/* Edit Vendor Modal */}
      {showEditModal && (
        <VendorModal
          vendorForm={vendorForm}
          setVendorForm={setVendorForm}
          onSave={handleCreateVendor}
          onClose={() => {
            setShowEditModal(false);
            setEditingVendor(null);
            setVendorForm({
              vendor_name: '',
              contact_person: '',
              email: '',
              phone: '',
              address: '',
              city: '',
              state: '',
              country: '',
              notes: '',
            });
          }}
          title="Edit Vendor"
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
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
            setShowUploadModal(false);
            setVendorFile(null);
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Upload Vendors</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Upload a CSV or Excel file with vendor data
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setVendorFile(e.target.files?.[0] || null)}
              style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setVendorFile(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadVendors}
                disabled={!vendorFile || uploading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !vendorFile || uploading ? 'var(--text-secondary)' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: !vendorFile || uploading ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showInvoiceModal && (
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
            setShowInvoiceModal(false);
            setSelectedVendors([]);
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '2rem',
              borderRadius: '0.75rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              Generate Invoice for Out of Stock Items
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Select vendors to generate invoices for out-of-stock products
            </p>
            <div style={{ marginBottom: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
              {vendors.filter((v) => v.is_active).map((vendor) => (
                <label
                  key={vendor.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedVendors.includes(vendor.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVendors([...selectedVendors, vendor.id]);
                      } else {
                        setSelectedVendors(selectedVendors.filter((id) => id !== vendor.id));
                      }
                    }}
                  />
                  {vendor.vendor_name}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedVendors([]);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateInvoice}
                disabled={selectedVendors.length === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: selectedVendors.length === 0 ? 'var(--text-secondary)' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: selectedVendors.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Generate Invoices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Vendor Modal Component
const VendorModal = ({
  vendorForm,
  setVendorForm,
  onSave,
  onClose,
  title,
}: {
  vendorForm: any;
  setVendorForm: (form: any) => void;
  onSave: () => void;
  onClose: () => void;
  title: string;
}) => {
  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: '0.75rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              Vendor Name *
            </label>
            <input
              type="text"
              value={vendorForm.vendor_name}
              onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Contact Person
              </label>
              <input
                type="text"
                value={vendorForm.contact_person}
                onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Email
              </label>
              <input
                type="email"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              Phone
            </label>
            <input
              type="text"
              value={vendorForm.phone}
              onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              Address
            </label>
            <textarea
              value={vendorForm.address}
              onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                minHeight: '80px',
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                City
              </label>
              <input
                type="text"
                value={vendorForm.city}
                onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                State
              </label>
              <input
                type="text"
                value={vendorForm.state}
                onChange={(e) => setVendorForm({ ...vendorForm, state: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Country
              </label>
              <input
                type="text"
                value={vendorForm.country}
                onChange={(e) => setVendorForm({ ...vendorForm, country: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              Notes
            </label>
            <textarea
              value={vendorForm.notes}
              onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                minHeight: '80px',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            onClick={onClose}
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
            onClick={onSave}
            disabled={!vendorForm.vendor_name.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              background: !vendorForm.vendor_name.trim() ? 'var(--text-secondary)' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: !vendorForm.vendor_name.trim() ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Products;
