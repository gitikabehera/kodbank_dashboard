import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, Unlock, Cpu, CreditCard, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const VirtualCard = ({ card, onUpdate }) => {
    const [reveal, setReveal] = useState(false);
    const [flipping, setFlipping] = useState(false);

    const toggleStatus = async () => {
        const newStatus = card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
        try {
            await api.put(`/cards/${card.id}/status`, { status: newStatus });
            onUpdate();
        } catch (err) {
            alert('Failed to update card status');
        }
    };

    const formatCardNumber = (num) => {
        if (!reveal) return '••••  ••••  ••••  ' + num.slice(-4);
        return num.match(/.{1,4}/g).join('  ');
    };

    return (
        <div style={{ perspective: '1000px', width: '100%', maxWidth: '380px' }}>
            <motion.div
                initial={false}
                animate={{ rotateY: flipping ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '220px',
                    transformStyle: 'preserve-3d',
                    cursor: 'pointer'
                }}
                onClick={() => setFlipping(!flipping)}
            >
                {/* Front of Card */}
                <div className="glass animated-bg" style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    padding: '25px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: card.status === 'FROZEN'
                        ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                        : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: 'white', fontWeight: '800', letterSpacing: '1px' }}>KODBANK ELITE</div>
                        <Cpu size={32} color="rgba(255,255,255,0.8)" />
                    </div>

                    <div>
                        <div style={{
                            fontSize: '1.4rem',
                            color: 'white',
                            letterSpacing: '3px',
                            fontFamily: 'monospace',
                            margin: '20px 0',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            {formatCardNumber(card.card_number)}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Expiry</p>
                                <p style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600' }}>{card.expiry_date}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Status</p>
                                <p style={{
                                    color: card.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                                    fontSize: '0.8rem',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    {card.status === 'ACTIVE' ? <Unlock size={12} /> : <Lock size={12} />} {card.status}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back of Card */}
                <div className="glass" style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: '#0f172a',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ width: '100%', height: '45px', background: '#000', marginTop: '25px' }}></div>
                    <div style={{ padding: '20px' }}>
                        <div style={{ background: '#fff', height: '35px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 10px' }}>
                            <span style={{ color: '#000', fontStyle: 'italic', fontWeight: '700', fontSize: '1rem', letterSpacing: '2px' }}>
                                {reveal ? card.cvv : '•••'}
                            </span>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.6rem', marginTop: '10px', textAlign: 'center' }}>
                            This virtual card is for secure online transactions only. Maintain confidentiality of your CVV.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: '0.8rem', padding: '10px' }}
                    onClick={(e) => { e.stopPropagation(); setReveal(!reveal); }}
                >
                    {reveal ? <><EyeOff size={14} /> Mask</> : <><Eye size={14} /> Reveal</>}
                </button>
                <button
                    className="btn"
                    style={{
                        flex: 1,
                        fontSize: '0.8rem',
                        padding: '10px',
                        background: card.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: card.status === 'ACTIVE' ? '#ef4444' : '#10b981'
                    }}
                    onClick={(e) => { e.stopPropagation(); toggleStatus(); }}
                >
                    {card.status === 'ACTIVE' ? <><Lock size={14} /> Freeze</> : <><Unlock size={14} /> Unfreeze</>}
                </button>
            </div>
        </div>
    );
};

export default VirtualCard;
