import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { hackathonApi, teamApi, submissionApi } from '../services/api';

export default function HackathonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const getUser = () => {
    try {
      const str = localStorage.getItem('user');
      return str && str !== 'undefined' ? JSON.parse(str) : null;
    } catch { return null; }
  };
  const user = getUser();

  const load = () => {
    hackathonApi.getById(id).then(res => setData(res.data)).catch(console.error);
  };

  useEffect(() => { load(); }, [id]);

  const createTeam = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await teamApi.create({ name: teamName, hackathonId: Number(id) });
      setMessage('Команда создана! Вы назначены капитаном.');
      setTeamName('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка');
    }
  };

  const joinTeam = async (teamId) => {
    setError(''); setMessage('');
    try {
      await teamApi.join(teamId);
      setMessage('Заявка на вступление отправлена капитану');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleTeamAction = async (teamId, targetUserId, action) => {
    setError(''); setMessage('');
    try {
      if (action === 'approve') {
        await teamApi.approve(teamId, targetUserId);
        setMessage('Участник принят в команду');
      } else {
        await teamApi.reject(teamId, targetUserId);
        setMessage('Заявка отклонена');
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка');
    }
  };

  const deleteHackathon = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот хакатон? Это действие необратимо.')) return;
    try {
      await hackathonApi.delete(id);
      navigate('/hackathons');
    } catch (err) {
      setError('Не удалось удалить хакатон');
    }
  };

  if (!data) return <div>Загрузка...</div>;

  const statusBadge = (status) => {
    const cls = status === 'Active' ? 'badge-active' : status === 'Completed' ? 'badge-completed' : 'badge-upcoming';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  const isOrganizer = user && data.organizerId === user.id;

  return (
    <div>
      <div className="card">
        <div className="flex" style={{ justifyContent: 'space-between' }}>
          <h2>{data.title}</h2>
          <div className="flex">
            {statusBadge(data.status)}
            {isOrganizer && (
              <button onClick={deleteHackathon} className="btn btn-danger">Удалить хакатон</button>
            )}
          </div>
        </div>
        <p className="meta">Организатор: {data.organizer.fullName} ({data.organizer.email})</p>
        <p className="meta">Период: {new Date(data.startDate).toLocaleDateString()} — {new Date(data.endDate).toLocaleDateString()}</p>
        <p style={{ marginTop: 15 }}>{data.description}</p>
      </div>

      <h3 style={{ margin: '20px 0 10px' }}>Команды ({data.teams.length})</h3>

      {user && data.status !== 'Completed' && (
        <div className="card">
          <form onSubmit={createTeam} className="flex">
            <input type="text" placeholder="Название новой команды" value={teamName}
              onChange={e => setTeamName(e.target.value)} required
              style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
            <button type="submit" className="btn">Создать команду</button>
          </form>
          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}
        </div>
      )}

      {data.teams.length === 0 ? (
        <div className="card">Пока нет команд. Будьте первыми!</div>
      ) : (
        data.teams.map(t => (
          <div key={t.id} className="card">
            <h4>{t.name}</h4>
            <p className="meta">Капитан: {t.captain}</p>
            <p className="meta">Участники ({t.members.length}): {t.members.length > 0 ? t.members.map(m => m.fullName).join(', ') : 'Пока нет'}</p>
            
            {user && t.captainId === user.id && t.pendingRequests.length > 0 && (
              <div style={{ marginTop: 15, padding: 10, background: '#f8f9fa', borderRadius: 4 }}>
                <strong style={{ fontSize: 14 }}>Заявки на вступление:</strong>
                {t.pendingRequests.map(req => (
                  <div key={req.id} className="flex" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                    <span>{req.fullName}</span>
                    <div className="flex">
                      <button onClick={() => handleTeamAction(t.id, req.id, 'approve')} className="btn" style={{ padding: '4px 8px', fontSize: 12 }}>Принять</button>
                      <button onClick={() => handleTeamAction(t.id, req.id, 'reject')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>Отклонить</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {user && data.status !== 'Completed' && t.captainId !== user.id && !t.members.some(m => m.id === user.id) && !t.pendingRequests.some(r => r.id === user.id) && (
              <button onClick={() => joinTeam(t.id)} className="btn btn-secondary" style={{ marginTop: 10 }}>
                Подать заявку на вступление
              </button>
            )}
            
            {user && t.pendingRequests.some(r => r.id === user.id) && (
              <p className="meta" style={{ color: '#856404', marginTop: 10 }}>Ваша заявка на рассмотрении у капитана</p>
            )}
          </div>
        ))
      )}

      {data.submissions.length > 0 && (
        <>
          <h3 style={{ margin: '20px 0 10px' }}>Решения ({data.submissions.length})</h3>
          {data.submissions.map(s => (
            <div key={s.id} className="card">
              <div className="flex" style={{ justifyContent: 'space-between' }}>
                <strong>Команда: {s.teamName}</strong>
                <span className="meta">{new Date(s.submittedAt).toLocaleString()}</span>
              </div>
              <p style={{ marginTop: 8 }}>Файл: {s.fileName}</p>
              {s.description && <p className="meta">{s.description}</p>}
              {s.repositoryUrl && <p className="meta">Репозиторий: <a href={s.repositoryUrl} target="_blank" rel="noreferrer">{s.repositoryUrl}</a></p>}
              <button 
                onClick={() => submissionApi.download(s.id, s.fileName)} 
                className="btn" 
                style={{ marginTop: 10 }}
              >
                Скачать файл
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}