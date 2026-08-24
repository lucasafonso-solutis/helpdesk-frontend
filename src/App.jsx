import { useState } from 'react';
import { Bell, FileText, LifeBuoy, Users } from 'lucide-react';
import ChamadosPage from './pages/ChamadosPage';
import EquipePage from './pages/EquipePage';
import NotificacoesPage from './pages/NotificacoesPage';

function App() {
  const [activeNav, setActiveNav] = useState('Chamados');
  const [ticketsCount, setTicketsCount] = useState(0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><LifeBuoy size={20} /></span><span>helpdesk<span className="brand-dot">.</span></span></div>
        <nav className="main-nav">
          <p className="nav-caption">Workspace</p>
          <button className={activeNav === 'Chamados' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('Chamados')}><FileText size={18} /> Chamados <span className="nav-count">{ticketsCount}</span></button>
          <button className={activeNav === 'Equipe' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('Equipe')}><Users size={18} /> Equipe</button>
          <button className={activeNav === 'Notificações' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('Notificações')}><Bell size={18} /> Notificações</button>
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{activeNav}</strong></div></header>
        {activeNav === 'Equipe' ? <EquipePage /> : activeNav === 'Notificações' ? <NotificacoesPage /> : <ChamadosPage onTicketsCountChange={setTicketsCount} />}
      </main>
    </div>
  );
}

export default App;
