import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Channels from './pages/Channels';
import Settings from './pages/Settings';
import { AuthProvider } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';

function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/channels" element={<Channels />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </DashboardProvider>
    </AuthProvider>
  );
}

export default App;
