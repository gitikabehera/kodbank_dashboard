import React, { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, User, ArrowRight, ShieldCheck, Wallet, ReceiptText, ArrowRightLeft, KeyRound, Info } from 'lucide-react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

const Transfer = () => {
    const navigate = useNavigate();
    const [receiverUid, setReceiverUid] = useState('');
    const [amount, setAmount] = useState('');
    const [otp, setOtp] = useState('');
    const [validation, setValidation] = useState({ loading: false, exists: null, uid: '', username: '', role: '' });
    const [loading, setLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState('');
    const [userBalance, setUserBalance] = useState(0);
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const fetchBalance = async () => {
        try {
            const res = await api.get('/profile');
            setUserBalance(parseFloat(res.data.user.balance));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, []);

    useEffect(() => {
        if (!receiverUid) {
            setValidation({ loading: false, exists: null, uid: '', username: '', role: '' });
            return;
        }

        if (receiverUid.toUpperCase() === currentUser.uid.toUpperCase()) {
            setValidation({ loading: false, exists: false, error: 'Cannot transfer to self' });
            return;
        }

        const handler = setTimeout(async () => {
            setValidation(v => ({ ...v, loading: true }));
            const cleanedUid = receiverUid.trim().toUpperCase();
            try {
                const res = await api.get(`/users/check/${cleanedUid}`);
                if (res.data.exists) {
                    setValidation({ loading: false, exists: true, uid: res.data.uid, username: res.data.username, role: res.data.role });
                } else {
                    setValidation({ loading: false, exists: false, uid: '', username: '', role: '' });
                }
            } catch (err) {
                setValidation({ loading: false, exists: false, username: '', role: '' });
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [receiverUid, currentUser.uid]);

    const handleRequestOtp = async () => {
        setOtpLoading(true);
        setError('');
        try {
            await api.post('/transactions/request-otp', { amount: parseFloat(amount) });
            setOtpSent(true);
        } catch (err) {
            setError(err.response?.data?.message || String(err));
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(null);

        const val = parseFloat(amount);

        // Frontend Rules Check
        if (val > userBalance) {
            setError('Insufficient funds for this transaction');
            return;
        }
        if (userBalance - val < 1000) {
            setError('Minimum balance of ₹1,000 must be maintained');
            return;
        }
        if (val > 20000) {
            setError('Maximum single transfer limit is ₹20,000');
            return;
        }
        if (val > 10000 && !otp) {
            setError('OTP is required for transfers above ₹10,000');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/transactions/transfer', {
                receiver_username: validation.uid,
                amount: val,
                otp: otp
            });

            if (res.data.success) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#8b5cf6', '#3b82f6', '#10b981']
                });

                setSuccess({
                    amount: val,
                    recipient: validation.username,
                    ref: res.data.reference_id
                });

                setAmount('');
                setReceiverUid('');
                setOtp('');
                setOtpSent(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const isReady = validation.exists && amount >= 1 && !loading && (parseFloat(amount) <= 10000 || otp.length === 6);

    if (success) {
        return (
            <div className="container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="glass" style={{ width: '100%', maxWidth: '450px', padding: '40px', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                        <CheckCircle2 size={45} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Transfer Successful</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Funds have been moved securely.</p>

                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '15px', padding: '20px', marginBottom: '30px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Amount Transferred</span>
                            <span style={{ fontWeight: '700', color: '#10b981' }}>₹{success.amount.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Recipient</span>
                            <span style={{ fontWeight: '600' }}>{success.recipient}</span>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Reference</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace' }}>#{success.ref}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSuccess(null)}>New Transfer</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/dashboard')}>Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
            <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                        <ArrowRightLeft size={28} color="#8b5cf6" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Direct Transfer</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Move capital instantly within the network</p>
                </div>

                {error && (
                    <div className="fade-in" style={{ padding: '15px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Recipient Input */}
                    <div className="input-group" style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Recipient Details</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Enter Username or ID"
                                value={receiverUid}
                                onChange={(e) => setReceiverUid(e.target.value)}
                                style={{ paddingRight: '45px' }}
                                autoComplete="off"
                            />
                            <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }}>
                                {validation.loading ? <Loader2 className="animate-spin" size={18} color="#3b82f6" /> : <User size={18} color="#64748b" />}
                            </div>
                        </div>

                        {validation.exists === true && (
                            <div className="fade-in" style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: '#10b981', borderRadius: '50%', padding: '3px' }}>
                                    <CheckCircle2 size={12} color="white" />
                                </div>
                                <span>Verified: <strong>{validation.username}</strong> <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>• {validation.role}</span></span>
                            </div>
                        )}
                        {validation.exists === false && receiverUid && (
                            <div className="fade-in" style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertCircle size={14} /> {validation.error || 'User not found in system'}
                            </div>
                        )}
                    </div>

                    {/* Amount Input */}
                    <div className="input-group" style={{ marginBottom: parseFloat(amount) > 10000 ? '20px' : '35px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Amount to Send</label>
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Available: ₹{userBalance.toLocaleString()}</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    if (parseFloat(e.target.value) <= 10000) setOtpSent(false);
                                }}
                                style={{ fontSize: '1.2rem', fontWeight: '700' }}
                            />
                            <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: '600' }}>INR</span>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '5px', alignItems: 'center', color: '#64748b', fontSize: '0.7rem' }}>
                            <Info size={12} /> Min Balance: ₹1,000 | Max Single: ₹20,000
                        </div>
                    </div>

                    {/* OTP Section (Conditional) */}
                    {parseFloat(amount) > 10000 && (
                        <div className="fade-in glass" style={{ marginBottom: '35px', padding: '20px', border: '1px dashed var(--accent-primary)', background: 'rgba(139, 92, 246, 0.02)' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px' }}>2-FACTOR AUTHENTICATION</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        type="text"
                                        placeholder="6-Digit OTP"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        disabled={!otpSent}
                                        style={{ letterSpacing: '8px', fontSize: '1.2rem', textAlign: 'center' }}
                                    />
                                    <KeyRound size={16} color="#64748b" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                                </div>
                                <button
                                    type="button"
                                    className={`btn ${otpSent ? 'btn-outline' : 'btn-primary'}`}
                                    onClick={handleRequestOtp}
                                    disabled={otpLoading || !amount || parseFloat(amount) <= 10000}
                                    style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}
                                >
                                    {otpLoading ? <Loader2 className="animate-spin" /> : (otpSent ? 'Resend' : 'Get OTP')}
                                </button>
                            </div>
                            {otpSent && <p style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '8px' }}>Success: Check backend console (Demo Mode)</p>}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '18px',
                            fontSize: '1rem',
                            background: isReady ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.03)',
                            boxShadow: isReady ? '0 10px 20px -5px rgba(59, 130, 246, 0.5)' : 'none'
                        }}
                        disabled={!isReady}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} /> Authorize Transfer</>}
                    </button>

                    <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem' }}>
                            <ShieldCheck size={14} color="#10b981" /> End-to-end Encrypted
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Transfer;
