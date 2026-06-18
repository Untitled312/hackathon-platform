import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log('Отправляем запрос на вход для:', form.email);
      const { data } = await authApi.login(form);
      
      console.log('Ответ от сервера получен:', data);
      
      localStorage.clear();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        role: data.role
      }));
      
      console.log('Новый токен сохранен. Начало токена:', data.token.substring(0, 30) + '...');
      console.log('ID пользователя в токене:', data.userId);
      
      navigate('/hackathons');
    } catch (err) {
      console.error('Ошибка входа:', err);
      setError(err.response?.data?.message || 'Ошибка входа. Проверьте email и пароль.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2 className="page-title">Вход</h2>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn" style={{ marginTop: 10 }}>Войти</button>
          <p style={{ marginTop: 15, fontSize: 14 }}>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
        </form>
      </div>
    </div>
  );
}