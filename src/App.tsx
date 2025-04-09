import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ReportViewer from './components/ReportViewer';
import Scripts from './components/Scripts';
import Knowledge from './components/Knowledge';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    // Проверка наличия пользователя в localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity > 60 * 60 * 1000) { // 60 минут
        setUser(null);
        localStorage.removeItem('user'); // Очистка при выходе
      }
    }, 60000); // Проверка каждую минуту

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearInterval(checkInactivity);
    };
  }, [lastActivity]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // Сохранение пользователя
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user'); // Очистка данных
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
          <Route index element={<Dashboard />} />
          <Route path="report/:type" element={<ReportViewer />} />
          <Route path="scripts" element={<Scripts />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
