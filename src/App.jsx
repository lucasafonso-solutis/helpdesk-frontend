import { useState } from 'react';
import { Bell, ChevronDown, FileText, LifeBuoy, Settings2, Users } from 'lucide-react';
import ChamadosPage from './pages/ChamadosPage';
import EquipePage from './pages/EquipePage';

function App() {
  const [activeNav, setActiveNav] = useState('Chamados');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><LifeBuoy size={20} /></span><span>helpdesk<span className="brand-dot">.</span></span></div>
        <nav className="main-nav">
          <p className="nav-caption">Workspace</p>
          <button className={activeNav === 'Chamados' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('Chamados')}><FileText size={18} /> Chamados <span className="nav-count">0</span></button>
          <button className={activeNav === 'Equipe' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('Equipe')}><Users size={18} /> Equipe</button>
          <button className="nav-item"><Bell size={18} /> Notificações <span className="notification-dot" /></button>
          <p className="nav-caption nav-caption-spaced">Gerenciar</p>
          <button className="nav-item"><Settings2 size={18} /> Configurações</button>
        </nav>
        <div className="sidebar-footer"><div className="profile-avatar">LA</div><div><strong>Lucas Afonso</strong><small>Administrador</small></div><ChevronDown size={15} /></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{activeNav}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notificações"><Bell size={19} /><span className="alert-dot" /></button><div className="top-avatar">LA</div></div></header>
        {activeNav === 'Equipe' ? <EquipePage /> : <ChamadosPage />}
      </main>
    </div>
  );
}

export default App;
