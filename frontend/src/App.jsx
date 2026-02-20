import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import TransactionHistory from './pages/TransactionHistory';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/global.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Navbar />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/transfer"
                        element={
                            <ProtectedRoute>
                                <Transfer />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/transactions"
                        element={
                            <ProtectedRoute>
                                <TransactionHistory />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <AdminPanel />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
