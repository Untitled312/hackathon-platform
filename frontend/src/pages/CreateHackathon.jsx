import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hackathonApi } from '../services/api';

export default function CreateHackathon() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', startDate: '', endDate: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await hackathonApi.create({
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString()
      });
      navigate(`/hackathons/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка создания');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '20px auto' }}>
      <h2 className="page-title">Создать хакатон</h2>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название</label>
            <input type="text" required value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea required value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Дата начала</label>
            <input type="datetime-local" required value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Дата окончания</label>
            <input type="datetime-local" required value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn">Создать</button>
        </form>
      </div>
    </div>
  );
}