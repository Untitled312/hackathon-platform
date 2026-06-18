import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teamApi } from '../services/api';

export default function MyTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
      const user = JSON.parse(userStr);
      return user.id;
    } catch (e) {
      return null;
    }
  };

  const userId = getUser();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    teamApi.getAll()
      .then(res => {
        const myTeams = res.data.filter(t => t.members.some(m => m.userId === userId));
        setTeams(myTeams);
      })
      .catch(err => {
        console.error('Ошибка загрузки команд:', err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Загрузка...</div>;
  if (!userId) return <div className="card">Пожалуйста, <Link to="/login">войдите в систему</Link>.</div>;

  return (
    <div>
      <h2 className="page-title">Мои команды</h2>
      {teams.length === 0 ? (
        <div className="card">
          Вы пока не состоите ни в одной команде.
          <Link to="/hackathons" style={{ marginLeft: 10 }}>Перейти к хакатонам</Link>
        </div>
      ) : (
        teams.map(t => (
          <div key={t.id} className="card">
            <h3>{t.name}</h3>
            <p className="meta">Хакатон: {t.hackathonTitle}</p>
            <p className="meta">Капитан: {t.captainName}</p>
            <p className="meta">Участники: {t.members.map(m => m.fullName).join(', ')}</p>
            <Link to={`/hackathons/${t.hackathonId}`} className="btn" style={{ marginTop: 10 }}>
              Перейти к хакатону
            </Link>
          </div>
        ))
      )}
    </div>
  );
}