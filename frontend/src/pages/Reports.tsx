import { useEffect, useState } from 'react';
import { reportService, SalesReport, ProductSalesReport, EndOfDayReport } from '../services/reportService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const [salesReport, setSalesReport] = useState<SalesReport[]>([]);
  const [productReport, setProductReport] = useState<ProductSalesReport[]>([]);
  const [endOfDayReport, setEndOfDayReport] = useState<EndOfDayReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eodDate, setEodDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [sales, products, eod] = await Promise.all([
        reportService.getSalesReport({ startDate, endDate }),
        reportService.getProductSalesReport({ startDate, endDate }),
        reportService.getEndOfDayReport(eodDate),
      ]);
      setSalesReport(sales);
      setProductReport(products);
      setEndOfDayReport(eod);
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

  const handleEodDateChange = (date: string) => {
    setEodDate(date);
    // Fetch only EOD report for efficiency if needed, but for now just reload all
    loadReports();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Reports</h1>

      {/* End of Day Summary */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>End of Day Summary</h2>
          <input
            type="date"
            value={eodDate}
            onChange={(e) => handleEodDateChange(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          />
        </div>

        {endOfDayReport ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {/* Stats Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Revenue Today</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--primary)' }}>
                  ₦{Number(endOfDayReport.summary.total_revenue || 0).toFixed(2)}
                </div>
              </div>
              <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Orders Completed</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{endOfDayReport.summary.total_orders}</div>
              </div>
            </div>

            {/* Payments Breakdown */}
            <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Payments by Method</h3>
              <div style={{ height: '150px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={endOfDayReport.payments}
                      dataKey="total_amount"
                      nameKey="payment_method"
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                    >
                      {endOfDayReport.payments.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `₦${Number(value).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Top Items Today</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {endOfDayReport.top_products.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text)', fontWeight: '500' }}>{p.product_name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.quantity_sold} sold</span>
                  </div>
                ))}
                {endOfDayReport.top_products.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>No sales today</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading summary...</div>
        )}
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
            {productReport.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>{item.product_name}</td>
                <td style={{ padding: '1rem' }}>{item.category}</td>
                <td style={{ padding: '1rem' }}>{item.total_quantity_sold}</td>
                <td style={{ padding: '1rem', fontWeight: '600' }}>₦{Number(item.total_revenue).toFixed(2)}</td>
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

