import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Shield, Send, LayoutDashboard, LogOut, History, Moon, Sun, Bell } from 'lucide-react';
import api from '../api';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userJson = localStorage.getItem('user');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    let user = null;
    try {
        user = userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        console.error("Auth state corrupted", e);
        localStorage.removeItem('user');
    }

    const handleLogout = async () => {
        try {
            await api.post('/logout');
            localStorage.removeItem('user');
            navigate('/login');
        } catch (err) {
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '20px', zIndex: 1000 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-primary)' }}>
                <div style={{ background: 'var(--accent-primary)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                    <Wallet size={20} color="white" />
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>KODBANK<span style={{ color: 'var(--accent-primary)' }}>.</span></span>
            </Link>

            <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                {!user ? (
                    <>
                        <Link to="/login" className="nav-link" style={isActive('/login') ? { color: 'var(--text-primary)' } : {}}>Sign In</Link>
                        <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Create Account</Link>
                    </>
                ) : (
                    <>
                        {user.role === 'Admin' && (
                            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} style={{ color: '#fb923c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={18} /> Admin
                            </Link>
                        )}

                        <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            <LayoutDashboard size={18} /> Overview
                        </Link>

                        <Link to="/transfer" className={`nav-link ${isActive('/transfer') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            <Send size={18} /> Transfer
                        </Link>

                        <Link to="/transactions" className={`nav-link ${isActive('/transactions') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            <History size={18} /> History
                        </Link>

                        <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 5px' }}></div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="btn-icon"
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '5px', display: 'flex' }}
                                    title="Toggle Theme"
                                >
                                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
                                <button className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '5px', display: 'flex' }}>
                                    <Bell size={20} />
                                </button>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: '600', lineHeight: 1, color: 'var(--text-primary)' }}>{user.username}</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{user.role}</p>
                            </div>
                            <button onClick={handleLogout} className="btn" style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px' }}>
                                <LogOut size={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
