import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { PersonProvider } from './hooks/usePerson';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import Arcade from './pages/Arcade';
import Wordle from './pages/Wordle';
import DateNight from './pages/DateNight';
import Stories from './pages/Stories';
import TypeA from './pages/TypeA/TypeA';
import Valentines from './pages/Valentines';

import './styles/global.css';
import './styles/christmas.css';
import './styles/typea.css';
import './styles/valentines.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PersonProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/arcade" element={<ProtectedRoute><Arcade /></ProtectedRoute>} />
            <Route path="/wordle" element={<ProtectedRoute><Wordle /></ProtectedRoute>} />
            <Route path="/date-night" element={<ProtectedRoute><DateNight /></ProtectedRoute>} />
            <Route path="/stories" element={<ProtectedRoute><Stories /></ProtectedRoute>} />
            <Route path="/typea" element={<ProtectedRoute><TypeA /></ProtectedRoute>} />
            <Route path="/valentines" element={<ProtectedRoute><Valentines /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PersonProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
