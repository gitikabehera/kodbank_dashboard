import React, { useState, useEffect } from 'react';
import { Download, Upload, Send, Loader2, CheckCircle2, AlertCircle, ShieldCheck, XCircle } from 'lucide-react';
import api from '../api';

const TransactionForms = ({ onActionSuccess, balance }) => {
    const [activeTab, setActiveTab] = useState('deposit');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [toast, setToast] = useState({ type: '', msg: '' });

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast({ type: '', msg: '' }), 5000);
    };

    const tabs = ['deposit', 'withdraw', 'transfer'];
    const activeIndex = tabs.indexOf(activeTab);

    const validate = () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return 'Please enter a valid amount';

        if (activeTab === 'withdraw') {
            if (val < 100) return 'Minimum withdrawal is ₹100';
            if (val > 50000) return 'Maximum withdrawal limit is ₹50,000';
            if (val > balance) return 'Insufficient account balance';
        }

        if (activeTab === 'transfer' && !recipient) return 'Recipient UID is required';
        return null;
    };

    const handleAction = async () => {
        const error = validate();
        if (error) {
            showToast('error', error);
            return;
        }

        setLoading(true);
        setShowConfirm(false);
        try {
            let payload = { amount: parseFloat(amount) };
            if (activeTab === 'transfer') payload.receiver_username = recipient; // Backend currently expects receiver_username, will fix backend too

            const res = await api.post(`/transactions/${activeTab}`, payload);

            if (res.data.success) {
                showToast('success', res.data.message);
                setAmount('');
                setRecipient('');
                onActionSuccess();
            } else {
                showToast('error', res.data.message || 'Transaction failed');
            }
        } catch (err) {
            console.error(err);
            showToast('error', err.response?.data?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass" style={{ padding: '25px', position: 'relative' }}>
            {/* Sliding Tab Indicator */}
            <div className="tab-container">
                <div
                    className="tab-active-indicator"
                    style={{
                        width: `calc(100% / 3 - 8px)`,
                        transform: `translateX(calc(${activeIndex} * 100%))`,
                        background: activeTab === 'withdraw' ? 'rgba(239, 68, 68, 0.8)' : activeTab === 'transfer' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                    }}
                />
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`btn-tab ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Toast Notifications */}
            {toast.msg && (
                <div className="fade-in" style={{
                    padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
                    background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
                    color: toast.type === 'success' ? '#10b981' : '#ef4444',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'
                }}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Recipient Account UID</label>
                    <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="e.g. USER-123" />
                </div>
                <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Transaction Amount (₹)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <span>Limit: ₹100 - ₹50,000</span>
                        <span>Available: ₹{parseFloat(balance).toLocaleString()}</span>
                    </div>
                </div>

                <button
                    onClick={() => setShowConfirm(true)}
                    className="btn btn-primary"
                    style={{
                        marginTop: '10px',
                        padding: '15px',
                        background: activeTab === 'withdraw' ? 'linear-gradient(135deg, #ef4444, #991b1b)' : activeTab === 'transfer' ? 'linear-gradient(135deg, #8b5cf6, #5b21b6)' : 'linear-gradient(135deg, #3b82f6, #1e40af)'
                    }}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Authorize {activeTab}</>}
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="modal-overlay">
                    <div className="glass fade-in" style={{ padding: '35px', maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ background: activeTab === 'withdraw' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <AlertCircle size={32} color={activeTab === 'withdraw' ? '#ef4444' : '#3b82f6'} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--text-primary)' }}>Authorize {activeTab.toUpperCase()}?</h3>
                        <p style={{ margin: '15px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            You are about to {activeTab} <strong>₹{parseFloat(amount).toLocaleString()}</strong>. This action is irreversible once authorized.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, background: activeTab === 'withdraw' ? '#ef4444' : '#3b82f6' }}
                                onClick={handleAction}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionForms;
