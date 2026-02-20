import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import api from '../api';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        uid: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        role: 'Customer'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/register', formData);
            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass fade-in" style={{ padding: '40px', width: '100%', maxWidth: '450px' }}>
                <h2 style={{ marginBottom: '30px', textAlign: 'center', color: 'var(--text-primary)' }}>Create Account</h2>

                {error && <div className="glass" style={{ padding: '10px', marginBottom: '20px', borderLeft: '4px solid var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <span className="error-msg">{error}</span>
                </div>}

                {success && <div className="glass" style={{ padding: '10px', marginBottom: '20px', borderLeft: '4px solid var(--success)', background: 'rgba(16, 185, 129, 0.1)' }}>
                    <span className="success-msg">{success}</span>
                </div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Unique User ID</label>
                        <input type="text" placeholder="e.g. USER123" required value={formData.uid} onChange={(e) => setFormData({ ...formData, uid: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Username</label>
                        <input type="text" placeholder="Choose a username" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input type="email" placeholder="name@example.com" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Phone Number</label>
                        <input type="tel" placeholder="+1..." value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" placeholder="••••••••" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> Sign Up</>}
                    </button>
                </form>

                <p style={{ marginTop: '25px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
