import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Hackathons from './pages/Hackathons';
import HackathonDetails from './pages/HackathonDetails';
import CreateHackathon from './pages/CreateHackathon';
import MyTeams from './pages/MyTeams';
import Submissions from './pages/Submissions';

// Динамическая проверка: читает localStorage в момент перехода на вкладку
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/hackathons" element={<Hackathons />} />
          <Route path="/hackathons/:id" element={<HackathonDetails />} />
          
          <Route path="/hackathons/new" element={<ProtectedRoute><CreateHackathon /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><MyTeams /></ProtectedRoute>} />
          <Route path="/submissions" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
          
          <Route path="/" element={<Navigate to="/hackathons" />} />
        </Routes>
      </div>
    </>
  );
}

export default App;