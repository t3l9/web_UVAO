import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import { Clock } from 'lucide-react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboards';
import ReportViewer from './components/ReportViewer';
import Scripts from './components/Scripts';
import Knowledge from './components/Knowledge';
import ArchiveReports from './components/Analytics/ArchiveReports';
import AnalyticsDashboard from './components/Analytics/Dashboard';
import TransferStatisticsReport from './components/TransferStatisticsReport';
import AdminPanel from './components/AdminPanel';
import axios, { AxiosError } from 'axios';
import debounce from 'lodash.debounce';

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [lastActivity, setLastActivity] = useState(() => {
    const savedTime = localStorage.getItem('lastActivity');
    return savedTime ? parseInt(savedTime, 10) : Date.now();
  });
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleActivity = debounce(async () => {
    const now = Date.now();
    setLastActivity(now);
    localStorage.setItem('lastActivity', now.toString());

    if (user) {
      try {
        await axios.post('/api/update-last-visit', {
          userId: user.id,
          lastVisit: formatDate(now),
        });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Axios error:', error.message);
          if (error.response) {
            console.error('Server response:', error.response.data);
            console.error('Status code:', error.response.status);
          } else if (error.request) {
            console.error('No response received:', error.request);
          } else {
            console.error('Request setup error:', error.message);
          }
        } else {
          console.error('Unknown error:', error);
        }
      }
    }
  }, 5000);

  useEffect(() => {
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    const checkInactivity = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > 90 * 60 * 1000) {
        setShowInactivityDialog(true);
        handleLogout();
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearInterval(checkInactivity);
    };
  }, [lastActivity, user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
  };

  const handleCloseInactivityDialog = () => {
    setShowInactivityDialog(false);
  };

  if (!user) {
    return (
      <ThemeProvider>
        <Login onLogin={handleLogin} />
        {showInactivityDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 dark:border-gray-800 animate-slide-up">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Сессия завершена
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-5">
                Рабочая сессия автоматически завершается после 90 минут
                неактивности. Для продолжения работы войдите в систему снова.
              </p>
              <button
                onClick={handleCloseInactivityDialog}
                className="w-full bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-medium py-2.5 rounded-xl transition-all duration-200"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
            <Route index element={<Dashboard user={user} />} />
            <Route path="report/:type" element={<ReportViewer user={user} />} />
            <Route path="scripts" element={<Scripts />} />
            <Route path="knowledge" element={<Knowledge user={user} />} />

            <Route path="analytics/archive" element={<ArchiveReports user={user} />} />
            <Route path="analytics/dashboard" element={<AnalyticsDashboard user={user} />} />
            <Route path="analytics/transfer-statistics" element={<TransferStatisticsReport />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;