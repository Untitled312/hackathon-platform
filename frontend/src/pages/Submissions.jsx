import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { submissionApi, hackathonApi, teamApi } from '../services/api';

export default function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [form, setForm] = useState({ hackathonId: '', teamId: '', description: '', repositoryUrl: '' });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
      return JSON.parse(userStr).id;
    } catch (e) {
      return null;
    }
  };

  const userId = getUser();

  const load = () => {
    const params = {};
    if (selectedHackathon) params.hackathonId = selectedHackathon;
    if (selectedTeam) params.teamId = selectedTeam;
    
    submissionApi.getAll(params)
      .then(res => setSubmissions(res.data))
      .catch(err => console.error('Ошибка загрузки решений:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    hackathonApi.getAll().then(res => setHackathons(res.data)).catch(console.error);
    
    teamApi.getAll().then(res => {
      const myTeams = res.data.filter(t => t.members.some(m => m.userId === userId));
      setTeams(myTeams);
    }).catch(console.error);

    load();
  }, [userId]);

  useEffect(() => {
    if (userId) load();
  }, [selectedHackathon, selectedTeam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!file) { setError('Выберите файл'); return; }
    
    const formData = new FormData();
    formData.append('teamId', form.teamId);
    formData.append('hackathonId', form.hackathonId);
    formData.append('file', file);
    if (form.description) formData.append('description', form.description);
    if (form.repositoryUrl) formData.append('repositoryUrl', form.repositoryUrl);

    try {
      await submissionApi.submit(formData);
      setMessage('Решение успешно загружено!');
      setFile(null);
      setForm({ hackathonId: '', teamId: '', description: '', repositoryUrl: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка загрузки');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!userId) return <div className="card">Пожалуйста, <Link to="/login">войдите в систему</Link>.</div>;

  return (
    <div>
      <h2 className="page-title">Решения</h2>

      <div className="card">
        <h3 style={{ marginBottom: 15 }}>Загрузить решение</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Хакатон</label>
            <select required value={form.hackathonId} onChange={e => setForm({ ...form, hackathonId: e.target.value })}>
              <option value="">Выберите хакатон</option>
              {hackathons.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Команда</label>
            <select required value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })}>
              <option value="">Выберите команду</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Файл решения</label>
            <input type="file" required onChange={e => setFile(e.target.files[0])} />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Ссылка на репозиторий</label>
            <input type="url" value={form.repositoryUrl} onChange={e => setForm({ ...form, repositoryUrl: e.target.value })} />
          </div>
          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}
          <button type="submit" className="btn">Загрузить</button>
        </form>
      </div>

      <div className="flex" style={{ margin: '20px 0', gap: 10 }}>
        <select value={selectedHackathon} onChange={e => setSelectedHackathon(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4 }}>
          <option value="">Все хакатоны</option>
          {hackathons.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
        <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4 }}>
          <option value="">Все команды</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {submissions.length === 0 ? (
        <div className="card">Решений пока нет</div>
      ) : (
        submissions.map(s => (
          <div key={s.id} className="card">
            <div className="flex" style={{ justifyContent: 'space-between' }}>
              <strong>{s.teamName}</strong>
              <span className="meta">{s.hackathonTitle}</span>
            </div>
            <p className="meta">{new Date(s.submittedAt).toLocaleString()}</p>
            <p style={{ marginTop: 8 }}>Файл: {s.fileName}</p>
            {s.description && <p className="meta">{s.description}</p>}
            {s.repositoryUrl && <p className="meta">Репозиторий: <a href={s.repositoryUrl} target="_blank" rel="noreferrer">{s.repositoryUrl}</a></p>}
            <button 
              onClick={() => submissionApi.download(s.id, s.fileName)} 
              className="btn" 
              style={{ marginTop: 10 }}
            >
              Скачать
            </button>
          </div>
        ))
      )}
    </div>
  );
}