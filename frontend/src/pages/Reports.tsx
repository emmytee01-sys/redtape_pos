import { useEffect, useState } from 'react';
import { reportService, SalesReport, ProductSalesReport } from '../services/reportService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [salesReport, setSalesReport] = useState<SalesReport[]>([]);
  const [productReport, setProductReport] = useState<ProductSalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [sales, products] = await Promise.all([
        reportService.getSalesReport({ startDate, endDate }),
        reportService.getProductSalesReport({ startDate, endDate }),
      ]);
      setSalesReport(sales);
      setProductReport(products);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setLoading(true);
    loadReports();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Reports</h1>

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
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Filter</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
              }}
            />
          </div>
          <button
            onClick={handleFilter}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Apply Filter
          </button>
        </div>
      </div>

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
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Sales Report</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesReport}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total_revenue" stroke="var(--primary)" name="Revenue" />
            <Line type="monotone" dataKey="order_count" stroke="var(--accent)" name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

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
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Top Products</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={productReport.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_revenue" fill="var(--primary)" name="Revenue" />
            <Bar dataKey="total_quantity_sold" fill="var(--accent)" name="Quantity Sold" />
          </BarChart>
        </ResponsiveContainer>
      </div>

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
            <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Product</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Quantity Sold</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {productReport.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>{item.product_name}</td>
                <td style={{ padding: '1rem' }}>{item.category}</td>
                <td style={{ padding: '1rem' }}>{item.total_quantity_sold}</td>
                <td style={{ padding: '1rem', fontWeight: '600' }}>₦{item.total_revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {productReport.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;

