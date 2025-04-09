import React, { useState, useEffect } from 'react';
import { User } from '../types';
import initSqlJs from 'sql.js';
import { Building2, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

function Login({ onLogin }: LoginProps) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [SQL, setSQL] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Инициализация SQL.js при монтировании компонента
  useEffect(() => {
    const loadSQL = async () => {
      try {
        const SQL = await initSqlJs({
          // Используем CDN
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        setSQL(SQL);
      } catch (err) {
        console.error('SQL.js initialization error:', err);
        setError('Ошибка инициализации базы данных');
      }
    };
    
    loadSQL();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!SQL) {
      setError('База данных не готова');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Загружаем файл базы данных
      const response = await fetch('/files/BD_work');
      if (!response.ok) throw new Error('Не удалось загрузить базу данных');
      
      // 2. Читаем данные
      const buffer = await response.arrayBuffer();
      
      // 3. Открываем базу данных
      const db = new SQL.Database(new Uint8Array(buffer));
      
      // 4. Безопасный запрос с параметрами (защита от SQL-инъекций)
      const result = db.exec(
        'SELECT ID, Name, Organization, Duty, Login FROM users WHERE Login = ? AND Password = ?',
        [login, password]
      );
      
      // 5. Обработка результата
      if (result.length > 0 && result[0].values.length > 0) {
        const [id, name, organization, duty, userLogin] = result[0].values[0];
        onLogin({
          id: id as number,
          name: name as string,
          organization: organization as string,
          duty: duty as string,
          login: userLogin as string
        });
      } else {
        setError('Неверный логин или пароль');
      }
    } catch (err) {
      console.error('Database error:', err);
      setError('Ошибка при подключении к базе данных');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: 'url(/files/1.png)' }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      <div className="relative bg-white/95 p-8 rounded-2xl shadow-2xl w-[420px] backdrop-blur-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Информационная система
          </h1>
          <p className="text-gray-600 mt-1">Префектура ЮВАО</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-1">
              Логин
            </label>
            <input
              id="login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="input-field"
              placeholder="Введите логин"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Введите пароль"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full btn-primary ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;