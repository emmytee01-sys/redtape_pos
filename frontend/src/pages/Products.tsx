import { useEffect, useState } from 'react';
import { productService, Product } from '../services/productService';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { vendorService, Vendor } from '../services/vendorService';
import {
  Plus,
  Upload,
  Search,
  FolderPlus,
  Download,
  Filter,
  ShoppingCart,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Components
import SalesPickItems from '../components/products/SalesPickItems';
import ProductFormModal from '../components/products/ProductFormModal';
import ProductTable from '../components/products/ProductTable';
import ProductDetailsModal from '../components/products/ProductDetailsModal';
import CategoryModal from '../components/products/CategoryModal';
import CSVUploadModal from '../components/products/CSVUploadModal';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPickItems, setShowPickItems] = useState(false);

  // Selection & Form
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [uploading] = useState(false);
  const [pickItemsSearch, setPickItemsSearch] = useState('');
  const [salesCart, setSalesCart] = useState<Array<{ product_id: number; product: Product; quantity: number }>>([]);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus] = useState<string>('all');
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

  const [selectedVendorsForProduct, setSelectedVendorsForProduct] = useState<number[]>([]);
  const [vendorPrices, setVendorPrices] = useState<Record<number, string>>({});

  const user = authService.getCurrentUser();
  const canManage = user?.role === 'manager' || user?.role === 'admin';
  const isSalesRep = user?.role === 'sales_rep';
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productData, vendorData] = await Promise.all([
        productService.getAll(true),
        canManage ? vendorService.getAll() : Promise.resolve([])
      ]);
      setProducts(productData);
      setVendors(vendorData);

      const uniqueCategories = Array.from(new Set(productData.map((p) => p.category).filter(Boolean)));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
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

      for (const vendorId of selectedVendorsForProduct) {
        const price = vendorPrices[vendorId];
        await vendorService.linkProduct(vendorId, product.id, {
          unit_price: price ? parseFloat(price) : undefined,
        });
      }

      loadData();
      setShowModal(false);
      resetForm();
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

      // Simplified update for vendors
      const existingVendors = await vendorService.getProductVendors(editingProduct.id);
      const toRemove = existingVendors.filter(ev => !selectedVendorsForProduct.includes(ev.vendor_id));
      for (const ev of toRemove) await vendorService.unlinkProduct(ev.vendor_id, editingProduct.id);

      for (const vendorId of selectedVendorsForProduct) {
        await vendorService.linkProduct(vendorId, editingProduct.id, {
          unit_price: vendorPrices[vendorId] ? parseFloat(vendorPrices[vendorId]) : undefined
        });
      }

      loadData();
      setShowEditModal(false);
      resetForm();
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

    const productVendors = await vendorService.getProductVendors(product.id);
    setSelectedVendorsForProduct(productVendors.map(pv => pv.vendor_id));
    const prices: Record<number, string> = {};
    productVendors.forEach(pv => { if (pv.unit_price) prices[pv.vendor_id] = pv.unit_price.toString(); });
    setVendorPrices(prices);
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
    setSelectedVendorsForProduct([]);
    setVendorPrices({});
    setEditingProduct(null);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || p.category === filterCategory || (!p.category && filterCategory === 'Uncategorized');
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' && p.is_active) || (filterStatus === 'inactive' && !p.is_active);

    let matchesStock = true;
    if (filterStock === 'out_of_stock') matchesStock = p.quantity === 0;
    else if (filterStock === 'low_stock') matchesStock = p.quantity > 0 && p.quantity <= p.min_stock_level;

    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  const handleCreateOrder = async (cart: any[]) => {
    try {
      await orderService.create({
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });
      alert('Order created successfully!');
      setSalesCart([]);
      setShowPickItems(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create order');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Inventory...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{isSalesRep ? 'Products Catalog' : 'Inventory Management'}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isSalesRep ? 'Browse products and create orders' : 'Manage stock levels, categories and suppliers'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isSalesRep ? (
            <button onClick={() => setShowPickItems(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              <ShoppingCart size={18} /> Pick Items
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/inventory-alerts')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', border: '1px solid #fca5a5', cursor: 'pointer', fontWeight: '600' }}
              >
                <Bell size={18} /> Alerts
              </button>
              <button onClick={() => { resetForm(); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                <Plus size={18} /> Add Product
              </button>
            </>
          )}
        </div>
      </div>

      {!isSalesRep && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => setShowCategoryModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer' }}><FolderPlus size={16} /> Category</button>
          <button onClick={() => setShowCSVModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer' }}><Upload size={16} /> Import</button>
          <button onClick={() => { }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer' }}><Download size={16} /> Export</button>
        </div>
      )}

      {/* Main Filter / Search Area */}
      <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search SKU, name, category..."
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
          />
        </div>
        {!isSalesRep && (
          <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: showFilters ? '#dc2626' : 'transparent', color: showFilters ? 'white' : 'var(--text)', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer' }}>
            <Filter size={18} /> Filter
          </button>
        )}
      </div>

      {showFilters && (
        <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStock} onChange={e => setFilterStock(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <option value="all">Stock Levels</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="low_stock">Low Stock</option>
          </select>
        </div>
      )}

      <ProductTable
        products={filteredProducts}
        canManage={canManage}
        selectedProducts={selectedProducts}
        onToggleSelect={(id) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
        onSelectAll={() => setSelectedProducts(selectedProducts.length === filteredProducts.length ? [] : filteredProducts.map(p => p.id))}
        onViewDetails={(p) => { setSelectedProduct(p); setShowDetailsModal(true); }}
        onEdit={handleEditClick}
        onToggleStatus={async (p) => { await productService.update(p.id, { is_active: !p.is_active }); loadData(); }}
      />

      <SalesPickItems
        show={showPickItems}
        onClose={() => setShowPickItems(false)}
        products={products}
        pickItemsSearch={pickItemsSearch}
        setPickItemsSearch={setPickItemsSearch}
        salesCart={salesCart}
        addToSalesCart={(p) => setSalesCart([...salesCart, { product_id: p.id, product: p, quantity: 1 }])}
        updateSalesCartQuantity={(id, q) => q <= 0 ? setSalesCart(salesCart.filter(i => i.product_id !== id)) : setSalesCart(salesCart.map(i => i.product_id === id ? { ...i, quantity: q } : i))}
        removeFromSalesCart={(id) => setSalesCart(salesCart.filter(i => i.product_id !== id))}
        onPlaceOrder={handleCreateOrder}
      />

      <ProductFormModal
        show={showModal || showEditModal}
        onClose={() => { setShowModal(false); setShowEditModal(false); resetForm(); }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        formData={productForm}
        setFormData={setProductForm}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        categories={categories}
        vendors={vendors}
        selectedVendors={selectedVendorsForProduct}
        setSelectedVendors={setSelectedVendorsForProduct}
        vendorPrices={vendorPrices}
        setVendorPrices={setVendorPrices}
      />

      <ProductDetailsModal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} product={selectedProduct} />
      <CategoryModal show={showCategoryModal} onClose={() => setShowCategoryModal(false)} newCategory={newCategory} setNewCategory={setNewCategory} onSubmit={() => { if (newCategory) { setCategories([...categories, newCategory]); setNewCategory(''); setShowCategoryModal(false); } }} />
      <CSVUploadModal show={showCSVModal} onClose={() => setShowCSVModal(false)} onUpload={async (f) => { try { await productService.uploadCSV(f); loadData(); setShowCSVModal(false); } catch (e) { alert('Upload failed'); } }} uploading={uploading} />
    </div>
  );
};

export default Products;
