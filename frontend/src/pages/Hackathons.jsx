import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hackathonApi } from '../services/api';

export default function Hackathons() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hackathonApi.getAll()
      .then(res => setHackathons(res.data))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (status) => {
    const cls = status === 'Active' ? 'badge-active' :
                status === 'Completed' ? 'badge-completed' : 'badge-upcoming';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <div className="flex" style={{ justifyContent: 'space-between', margin: '20px 0' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Хакатоны</h2>
        {localStorage.getItem('token') && (
          <Link to="/hackathons/new" className="btn">+ Создать хакатон</Link>
        )}
      </div>

      {hackathons.length === 0 ? (
        <div className="card">Пока нет хакатонов</div>
      ) : (
        <div className="grid">
          {hackathons.map(h => (
            <div key={h.id} className="card">
              <div className="flex" style={{ justifyContent: 'space-between' }}>
                <h3>{h.title}</h3>
                {statusBadge(h.status)}
              </div>
              <p className="meta">Организатор: {h.organizerName}</p>
              <p className="meta">
                {new Date(h.startDate).toLocaleDateString()} — {new Date(h.endDate).toLocaleDateString()}
              </p>
              <p className="meta">Команд: {h.teamsCount}</p>
              <p style={{ marginTop: 10, fontSize: 14 }}>{h.description.substring(0, 150)}...</p>
              <Link to={`/hackathons/${h.id}`} className="btn" style={{ marginTop: 12 }}>Подробнее</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}