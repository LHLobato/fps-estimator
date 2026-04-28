import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Estimate from './pages/Estimate';
import Games from './pages/Games';
import Compare from './pages/Compare';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      {/* Navbar Temporária (depois você estiliza com o Glassmorphism) */}
      <nav style={{ padding: '20px', borderBottom: '1px solid var(--primary-cyan)' }}>
        <Link to="/" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>HOME</Link>
        <Link to="/estimate" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>ESTIMAR FPS</Link>
        <Link to="/games" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>JOGOS</Link>
        <Link to="/compare" style={{ color: 'white', textDecoration: 'none' }}>COMPARAR HARDWARE</Link>
      </nav>

      {/* O Controle de Rotas */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/estimate" element={<Estimate />} />
        <Route path="/games" element={<Games />} />
        <Route path="/compare" element={<Compare />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;