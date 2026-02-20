import React, { useEffect, useState } from 'react';
import {
    Users, Landmark, ShieldAlert, ShieldCheck, Loader2,
    TrendingUp, Activity, Trash2, Edit3, UserPlus,
    Search, Filter, ArrowUpRight, ArrowDownLeft, Shield
} from 'lucide-react';
import api from '../api';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ users: 0, balance: 0, transactions: 0 });
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('users');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showAdjust, setShowAdjust] = useState(false);
    const [newBal, setNewBal] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [uRes, tRes, sRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/transactions'),
                api.get('/admin/stats')
            ]);
            setUsers(uRes.data.users);
            setTransactions(tRes.data.transactions);
            setStats(sRes.data.stats);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (action, uid, data = {}) => {
        try {
            if (action === 'freeze') await api.put(`/admin/freeze/${uid}`, data);
            if (action === 'adjust') await api.put('/admin/adjust-balance', { uid, newBalance: data });
            if (action === 'promote') await api.put(`/admin/promote/${uid}`);
            if (action === 'delete') {
                if (!window.confirm('CRITICAL: Are you sure you want to purge this entity?')) return;
                await api.delete(`/admin/delete/${uid}`);
            }
            fetchData();
            setShowAdjust(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.uid.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
            <Loader2 className="animate-spin" size={40} color="#3b82f6" />
            <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '0.8rem', letterSpacing: '2px' }}>INITIALIZING ADMIN CONSOLE...</p>
        </div>
    );

    return (
        <div className="container fade-in" style={{ padding: '40px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-1px' }}>System Command</h2>
                    <p style={{ color: '#94a3b8' }}>Real-time oversight of the Kodbank ecosystem.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={`btn ${activeView === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveView('users')}>User Grid</button>
                    <button className={`btn ${activeView === 'txns' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveView('txns')}>Global Logs</button>
                </div>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '40px' }}>
                <div className="glass animated-bg" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Deposits</p>
                            <h2 style={{ fontSize: '1.8rem', margin: '5px 0' }}>₹{stats.balance.toLocaleString()}</h2>
                        </div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}><Landmark color="#10b981" /></div>
                    </div>
                </div>
                <div className="glass" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Registered Entities</p>
                            <h2 style={{ fontSize: '1.8rem', margin: '5px 0' }}>{stats.users}</h2>
                        </div>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px' }}><Users color="#3b82f6" /></div>
                    </div>
                </div>
                <div className="glass" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Throughput</p>
                            <h2 style={{ fontSize: '1.8rem', margin: '5px 0' }}>{stats.transactions}</h2>
                        </div>
                        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '12px' }}><Activity color="#8b5cf6" /></div>
                    </div>
                </div>
            </div>

            {activeView === 'users' ? (
                <div className="glass" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>User Management</h3>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <input
                                type="text"
                                placeholder="Search by UID or Username..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
                            />
                            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '15px', top: '15px' }} />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Identity</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Access Level</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Liquidity</th>
                                    <th style={{ textAlign: 'center', padding: '15px' }}>Status</th>
                                    <th style={{ textAlign: 'right', padding: '15px' }}>Operations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ fontWeight: '600' }}>{u.username}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{u.uid}</div>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{
                                                fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', fontWeight: '700',
                                                background: u.role === 'Admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                color: u.role === 'Admin' ? '#ef4444' : '#3b82f6'
                                            }}>{u.role.toUpperCase()}</span>
                                        </td>
                                        <td style={{ padding: '15px', fontWeight: '700' }}>₹{parseFloat(u.balance).toLocaleString()}</td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            {u.is_frozen ?
                                                <span style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><ShieldAlert size={12} /> FROZEN</span> :
                                                <span style={{ color: '#10b981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><ShieldCheck size={12} /> ACTIVE</span>
                                            }
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => { setSelectedUser(u); setNewBal(u.balance); setShowAdjust(true); }} className="btn btn-outline" style={{ padding: '6px', borderRadius: '8px' }} title="Calibrate Balance"><Edit3 size={14} /></button>
                                                {u.role !== 'Manager' && u.role !== 'Admin' && <button onClick={() => handleAction('promote', u.uid)} className="btn btn-outline" style={{ padding: '6px', borderRadius: '8px' }} title="Promote to Manager"><UserPlus size={14} /></button>}
                                                <button onClick={() => handleAction('freeze', u.uid, { freeze: !u.is_frozen })} className="btn btn-outline" style={{ padding: '6px', borderRadius: '8px', color: u.is_frozen ? '#10b981' : '#ef4444' }} title={u.is_frozen ? "Authorize Access" : "Restrict Access"}>{u.is_frozen ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}</button>
                                                <button onClick={() => handleAction('delete', u.uid)} className="btn" style={{ padding: '6px', borderRadius: '8px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }} title="Purge Account"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="glass" style={{ padding: '30px' }}>
                    <h3 style={{ marginBottom: '25px', fontSize: '1.2rem', fontWeight: '700' }}>Global Audit Logs</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Type</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Involved Parties</th>
                                    <th style={{ textAlign: 'right', padding: '15px' }}>Volume</th>
                                    <th style={{ textAlign: 'right', padding: '15px' }}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t.txn_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                {t.type === 'DEPOSIT' || t.type === 'TRANSFER' && t.receiver_uid ? <ArrowDownLeft size={14} color="#10b981" /> : <ArrowUpRight size={14} color="#ef4444" />}
                                                {t.type}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ fontSize: '0.85rem' }}>{t.sender_name || 'System'} → {t.receiver_name || 'System'}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Ref: #{t.reference_id?.slice(0, 8)}</div>
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right', fontWeight: '700' }}>₹{parseFloat(t.amount).toLocaleString()}</td>
                                        <td style={{ padding: '15px', textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>{new Date(t.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Adjust Balance Modal */}
            {showAdjust && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass fade-in" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
                        <h3 style={{ marginBottom: '20px' }}>Calibrate Liquidity</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>Adjusting balance for <strong>{selectedUser?.username}</strong> ({selectedUser?.uid})</p>

                        <div className="input-group">
                            <label>Revised Balance (INR)</label>
                            <input
                                type="number"
                                value={newBal}
                                onChange={(e) => setNewBal(e.target.value)}
                                style={{ fontSize: '1.2rem', fontWeight: '700' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAdjust(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleAction('adjust', selectedUser.uid, newBal)}>Apply Reset</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
