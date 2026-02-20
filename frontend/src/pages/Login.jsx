import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';
import api from '../api';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(new URLSearchParams(window.location.search).get('expired') ? 'Session expired. Please log in again.' : '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/login', formData);
            if (response.data.success) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass fade-in" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ marginBottom: '10px', textAlign: 'center', color: 'var(--text-primary)' }}>Welcome Back</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '30px', fontSize: '0.9rem' }}>Enter your credentials to access your account</p>

                {error && <div className="glass" style={{ padding: '10px', marginBottom: '20px', borderLeft: '4px solid var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <span className="error-msg">{error}</span>
                </div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Username</label>
                        <input type="text" placeholder="Enter username" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                    </div>
                    <div className="input-group" style={{ marginBottom: '10px' }}>
                        <label>Password</label>
                        <input type="password" placeholder="••••••••" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                        <Link to="#" style={{ color: '#3b82f6', fontSize: '0.85rem', textDecoration: 'none' }}>Forgot password?</Link>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={18} /> Sign In</>}
                    </button>
                </form>

                <p style={{ marginTop: '25px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
