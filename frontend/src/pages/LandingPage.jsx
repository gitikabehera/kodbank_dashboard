import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
            <div className="fade-in">
                <h1 style={{ fontSize: '4rem', marginBottom: '20px', color: 'var(--text-primary)' }}>The Future of <br /><span style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Digital Finance</span></h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
                    Experience seamless banking with Kodbank. Secure, transparent, and built for the modern generation. Get started in minutes.
                </p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <Link to="/register" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem', textDecoration: 'none' }}>
                        Create Account <ArrowRight size={20} />
                    </Link>
                    <Link to="/login" className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '1.1rem', textDecoration: 'none' }}>
                        Welcome Back
                    </Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginTop: '100px' }}>
                <div className="glass fade-in" style={{ padding: '40px', textAlign: 'left', animationDelay: '0.2s' }}>
                    <div style={{ color: '#3b82f6', marginBottom: '20px' }}><Shield size={40} /></div>
                    <h3 style={{ color: 'var(--text-primary)' }}>Military Grade Security</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Your data and funds are protected by the latest encryption standards.</p>
                </div>
                <div className="glass fade-in" style={{ padding: '40px', textAlign: 'left', animationDelay: '0.4s' }}>
                    <div style={{ color: 'var(--accent-primary)', marginBottom: '20px' }}><Zap size={40} /></div>
                    <h3 style={{ color: 'var(--text-primary)' }}>Instant Transfers</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Move money across accounts instantly with zero delay.</p>
                </div>
                <div className="glass fade-in" style={{ padding: '40px', textAlign: 'left', animationDelay: '0.6s' }}>
                    <div style={{ color: 'var(--accent-primary)', marginBottom: '20px' }}><Globe size={40} /></div>
                    <h3 style={{ color: 'var(--text-primary)' }}>Global Access</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Manage your finances from anywhere in the world on any device.</p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
