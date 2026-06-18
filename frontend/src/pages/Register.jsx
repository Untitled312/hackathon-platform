import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await authApi.register(form);
      
      // Полная очистка перед записью новых данных
      localStorage.clear();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        role: data.role
      }));
      
      navigate('/hackathons');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2 className="page-title">Регистрация</h2>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя</label>
            <input 
              type="text" 
              required 
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              required 
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label>Пароль (мин. 6 символов)</label>
            <input 
              type="password" 
              required 
              minLength={6} 
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} 
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn" style={{ marginTop: 10 }}>Создать аккаунт</button>
          <p style={{ marginTop: 15, fontSize: 14 }}>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </form>
      </div>
    </div>
  );
}