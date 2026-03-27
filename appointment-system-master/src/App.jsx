import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { LogOut, Activity } from 'lucide-react';
import './index.css';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { currentUser } = useAppContext();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (roleRequired && currentUser.role !== roleRequired) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/patient'} replace />;
  }
  return children;
};

const Header = () => {
  const { currentUser, logout } = useAppContext();
  if (!currentUser) return null;
  return (
    <header className="stunning-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1677ff' }}>
        <Activity size={28} />
        <h2 style={{ margin: 0, fontWeight: 700, color: '#1677ff' }}>MediConnect</h2>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: 15 }}>Welcome, <b>{currentUser.username}</b> ({currentUser.role})</span>
        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#666', fontWeight: 500 }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </header>
  );
};

const AppRoutes = () => {
  const { currentUser } = useAppContext();
  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to={`/${currentUser.role}`} replace />} />
        <Route path="/patient" element={<ProtectedRoute roleRequired="patient"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roleRequired="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;
