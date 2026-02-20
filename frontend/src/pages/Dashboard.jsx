import React, { useEffect, useState } from 'react';
import {
    RefreshCw, TrendingUp, ArrowUpRight, ArrowDownLeft, Wallet,
    ShieldCheck, History, Filter, Loader2, BarChart3, Eye, EyeOff,
    PieChart as PieIcon, LineChart as LineIcon, Activity, Landmark, Users as UsersIcon,
    CreditCard, Plus, ChevronRight
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import CountUp from 'react-countup';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import TransactionForms from '../components/TransactionForms';
import VirtualCard from '../components/VirtualCard';
import confetti from 'canvas-confetti';

const Dashboard = () => {
    const [userData, setUserData] = useState(null);
    const [history, setHistory] = useState([]);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [cardLoading, setCardLoading] = useState(false);
    const [filterType, setFilterType] = useState('All');
    const [displayBalance, setDisplayBalance] = useState(0);
    const [showBalance, setShowBalance] = useState(false);
    const [globalStats, setGlobalStats] = useState({ users: 0, balance: 0, transactions: 0 });

    const fetchData = async () => {
        try {
            const [profileRes, historyRes, statsRes, cardsRes] = await Promise.all([
                api.get('/profile'),
                api.get(`/transactions/history?type=${filterType}`),
                api.get('/admin/stats').catch(() => ({ data: { stats: { users: 0, balance: 0, transactions: 0 } } })),
                api.get('/cards')
            ]);
            setUserData(profileRes.data.user);
            setHistory(historyRes.data.transactions || []);
            setGlobalStats(statsRes.data.stats);
            setCards(cardsRes.data.cards || []);
            if (profileRes.data.user) {
                setDisplayBalance(parseFloat(profileRes.data.user.balance) || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleIssueCard = async () => {
        setCardLoading(true);
        try {
            await api.post('/cards/issue');
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#8b5cf6', '#10b981']
            });
            fetchData();
        } catch (err) {
            alert('Card issuance failed');
        } finally {
            setCardLoading(false);
        }
    };

    const handleBalanceCheck = async () => {
        setBalanceLoading(true);
        try {
            const res = await api.get('/profile');
            setUserData(res.data.user);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#8b5cf6', '#10b981']
            });
            setDisplayBalance(parseFloat(res.data.user.balance));
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => setBalanceLoading(false), 800);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterType]);

    // Analytics Data Prep
    const chartData = history.slice(0, 7).reverse().map(t => ({
        name: new Date(t.created_at).toLocaleDateString(undefined, { weekday: 'short' }),
        amount: parseFloat(t.amount)
    }));

    const pieData = [
        { name: 'Sent', value: history.filter(t => t.type !== 'DEPOSIT').length, color: '#ef4444' },
        { name: 'Received', value: history.filter(t => t.type === 'DEPOSIT').length, color: '#10b981' }
    ];

    if (loading && !userData) {
        return (
            <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <Loader2 className="animate-spin" size={40} color="var(--accent-primary)" />
                <p style={{ marginTop: '20px', color: 'var(--text-secondary)', letterSpacing: '2px', fontSize: '0.8rem' }}>INITIALIZING INTERFACE...</p>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ padding: '30px 0' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <h2 style={{ fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-1px', color: 'var(--text-primary)' }}>Welcome, {userData?.username}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your financial ecosystem is performing <span style={{ color: 'var(--success)', fontWeight: '700' }}>optimally</span>.</p>
                </motion.div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button className="btn btn-outline" onClick={handleBalanceCheck} disabled={balanceLoading}>
                        {balanceLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                        Sync Ledger
                    </button>
                </div>
            </div>

            {/* Only show Global Metrics for Admins */}
            {userData?.role === 'Admin' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    {[
                        { label: 'Total Volume', val: globalStats.balance, prefix: '₹', icon: <Landmark size={20} color="#10b981" />, bg: 'rgba(16, 185, 129, 0.1)' },
                        { label: 'Network Users', val: globalStats.users, prefix: '', icon: <UsersIcon size={20} color="#3b82f6" />, bg: 'rgba(59, 130, 246, 0.1)' },
                        { label: 'Transactions', val: globalStats.transactions, prefix: '', icon: <Activity size={20} color="#8b5cf6" />, bg: 'rgba(139, 92, 246, 0.1)' },
                        { label: 'System Health', val: 100, prefix: '', icon: <ShieldCheck size={20} color="#f59e0b" />, bg: 'rgba(245, 158, 11, 0.1)' }
                    ].map((stat, i) => (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className="glass"
                            style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-primary)' }}
                        >
                            <div style={{ background: stat.bg, padding: '12px', borderRadius: '12px' }}>{stat.icon}</div>
                            <div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>{stat.label}</p>
                                <h3 style={{ fontSize: '1.2rem', margin: '2px 0' }}>{stat.prefix}<CountUp end={stat.val} duration={2} separator="," /></h3>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '30px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                    {/* Premium Balance Card */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass animated-bg glow-card"
                        style={{ padding: '40px', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div onClick={() => setShowBalance(!showBalance)} style={{ cursor: 'pointer', flex: 1 }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    Portfolio Liquidity {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                                </p>
                                <h1 className="balance-text" style={{
                                    fontSize: '4.2rem',
                                    margin: '15px 0',
                                    letterSpacing: showBalance ? '-2px' : '6px',
                                    filter: showBalance ? 'none' : 'blur(12px)',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}>
                                    {showBalance ? (
                                        <>₹<CountUp end={displayBalance} decimals={2} duration={1.5} separator="," /></>
                                    ) : '₹ ••••••••'}
                                </h1>
                            </div>
                            <div style={{ background: 'var(--accent-primary)', padding: '20px', borderRadius: '20px', height: 'fit-content', boxShadow: '0 10px 30px var(--glow)' }}>
                                <Wallet size={32} color="white" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 15px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700' }}>
                                <TrendingUp size={16} /> +₹{(displayBalance * 0.024).toFixed(2)} est.
                            </div>
                            <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                <ShieldCheck size={16} color="var(--accent-primary)" /> Verified Protection
                            </div>
                        </div>
                    </motion.div>

                    {/* Virtual Card Management */}
                    <div className="glass" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <CreditCard size={20} color="var(--accent-primary)" /> Digital Card Assets
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage your secure virtual payment entities</p>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '10px 15px', fontSize: '0.8rem' }}
                                onClick={handleIssueCard}
                                disabled={cardLoading || cards.length >= 2}
                            >
                                {cardLoading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Issue New Card</>}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                            {cards.map(card => (
                                <VirtualCard key={card.id} card={card} onUpdate={fetchData} />
                            ))}
                            {cards.length === 0 && (
                                <div style={{
                                    gridColumn: '1/-1',
                                    padding: '40px',
                                    textAlign: 'center',
                                    border: '2px dashed var(--glass-border)',
                                    borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.01)'
                                }}>
                                    <ShieldCheck size={40} color="var(--text-secondary)" style={{ margin: '0 auto 15px', opacity: 0.3 }} />
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>No active digital cards found.</p>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '5px' }}>Issue a virtual card for secure online spending.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Analytics Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                        <div className="glass" style={{ padding: '25px', height: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}><LineIcon size={18} color="var(--accent-primary)" /> Weekly Activity</h4>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>LAST 7 RECORDS</span>
                            </div>
                            <ResponsiveContainer width="100%" height="80%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '10px' }} />
                                    <Area type="monotone" dataKey="amount" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="glass" style={{ padding: '25px', height: '300px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-primary)' }}><PieIcon size={18} color="var(--accent-secondary)" /> Expense Ratio</h4>
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '0.7rem', marginTop: '-20px' }}>
                                <span style={{ color: '#10b981' }}>● Received</span>
                                <span style={{ color: '#ef4444' }}>● Sent</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {/* Action Panel */}
                    <TransactionForms onActionSuccess={fetchData} balance={userData?.balance} />

                    {/* Mini History Sidebar */}
                    <div className="glass" style={{ padding: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <History size={20} color="var(--accent-secondary)" /> Ledger
                            </h3>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="All">Global</option>
                                <option value="Deposit">Credit</option>
                                <option value="Transfer">Debit</option>
                            </select>
                        </div>
                        <AnimatePresence>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                {history.slice(0, 10).map((t, i) => (
                                    <motion.div
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        key={t.txn_id}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
                                    >
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ background: t.type === 'DEPOSIT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '10px' }}>
                                                {t.type === 'DEPOSIT' ? <ArrowDownLeft size={16} color="#10b981" /> : <ArrowUpRight size={16} color="#ef4444" />}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.type}</p>
                                                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: '800', color: t.type === 'DEPOSIT' ? '#10b981' : 'var(--text-primary)' }}>
                                            {t.type === 'DEPOSIT' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString()}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
