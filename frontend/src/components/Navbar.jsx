import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="navbar">
      <Link to="/hackathons" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h1>Hackathon Platform</h1>
      </Link>
      <nav>
        <Link to="/hackathons">Хакатоны</Link>
        {token && (
          <>
            <Link to="/teams">Мои команды</Link>
            <Link to="/submissions">Решения</Link>
            <span style={{ marginLeft: 20, color: '#667' }}>{user.fullName}</span>
            <button onClick={logout} className="btn btn-secondary" style={{ marginLeft: 10 }}>
              Выйти
            </button>
          </>
        )}
        {!token && (
          <>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </nav>
    </div>
  );
}