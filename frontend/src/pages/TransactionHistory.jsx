import React, { useState, useEffect } from 'react';
import { History, Download, Filter, ChevronLeft, ChevronRight, Search, Loader2, ArrowUpRight, ArrowDownLeft, FileSpreadsheet, ArrowRight } from 'lucide-react';
import api from '../api';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: 'All', page: 1 });
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/transactions?type=${filters.type}&page=${filters.page}`);
            setTransactions(res.data.transactions);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [filters]);

    const downloadCSV = () => {
        const headers = ['Date,Reference,Type,Sender,Receiver,Amount,Status\n'];
        const csvData = transactions.map(t => {
            const date = new Date(t.created_at).toLocaleString();
            const type = t.sender_uid === currentUser.uid ? 'SENT' : t.receiver_uid === currentUser.uid ? 'RECEIVED' : t.type;
            const sender = t.sender_name || 'EXTERNAL';
            const receiver = t.receiver_name || 'EXTERNAL';
            return `${date},${t.reference_id},${type},${sender},${receiver},${t.amount},${t.status}`;
        }).join('\n');

        const blob = new Blob([headers + csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Kodbank_History_${new Date().toLocaleDateString()}.csv`;
        a.click();
    };

    const getTypeDisplay = (t) => {
        if (t.type === 'TRANSFER') {
            return t.sender_uid === currentUser.uid ? 'SENT' : 'RECEIVED';
        }
        return t.type;
    };

    return (
        <div className="container fade-in" style={{ padding: '40px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <History size={32} color="var(--accent-primary)" /> Ledger Analytics
                    </h2>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Audited history of all financial movement.</p>
                </div>
                <button className="btn btn-outline" onClick={downloadCSV} style={{ gap: '10px' }}>
                    <FileSpreadsheet size={18} color="#10b981" /> Export CSV
                </button>
            </div>

            <div className="glass" style={{ padding: '30px' }}>
                {/* Filters */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                    {['All', 'Sent', 'Received', 'Deposit', 'Withdraw'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilters({ ...filters, type: t, page: 1 })}
                            className={`btn ${filters.type === t ? 'btn-primary' : 'btn-outline'}`}
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" size={40} color="var(--accent-primary)" />
                        <p style={{ marginTop: '20px', color: '#64748b' }}>SYNCHRONIZING LEDGER...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '15px 10px' }}>Execution Date</th>
                                    <th style={{ textAlign: 'left', padding: '15px 10px' }}>Reference</th>
                                    <th style={{ textAlign: 'left', padding: '15px 10px' }}>Direction</th>
                                    <th style={{ textAlign: 'left', padding: '15px 10px' }}>Parties</th>
                                    <th style={{ textAlign: 'right', padding: '15px 10px' }}>Volume</th>
                                    <th style={{ textAlign: 'center', padding: '15px 10px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t, i) => {
                                    const type = getTypeDisplay(t);
                                    const isDebit = type === 'SENT' || type === 'WITHDRAW';
                                    return (
                                        <tr key={t.txn_id} className="fade-in" style={{
                                            animationDelay: `${i * 0.05}s`,
                                            transition: 'background 0.2s',
                                            borderBottom: '1px solid rgba(255,255,255,0.02)'
                                        }}>
                                            <td style={{ padding: '18px 10px', fontSize: '0.85rem' }}>
                                                {new Date(t.created_at).toLocaleDateString()}
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td style={{ padding: '18px 10px', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                #{t.reference_id?.slice(0, 8) || 'LEGACY'}
                                            </td>
                                            <td style={{ padding: '18px 10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                                    {isDebit ? <ArrowUpRight size={14} color="#ef4444" /> : <ArrowDownLeft size={14} color="#10b981" />}
                                                    <span style={{ fontWeight: '600', color: isDebit ? '#ef4444' : '#10b981' }}>{type}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 10px', fontSize: '0.8rem' }}>
                                                <div style={{ color: '#f8fafc' }}>{t.sender_name || 'System'}</div>
                                                <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <ArrowRight size={10} /> {t.receiver_name || 'System'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 10px', textAlign: 'right', fontWeight: '700', fontSize: '1rem' }}>
                                                ₹{parseFloat(t.amount).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '18px 10px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: '800',
                                                    background: t.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: t.status === 'SUCCESS' ? '#10b981' : '#ef4444',
                                                    border: `1px solid ${t.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                                }}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {transactions.length === 0 && (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                No transaction records found for this criteria.
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="btn btn-outline"
                            disabled={filters.page === 1}
                            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                            style={{ padding: '8px' }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            className="btn btn-outline"
                            disabled={filters.page === pagination.totalPages}
                            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                            style={{ padding: '8px' }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionHistory;
