import { useState } from 'react';
import { Bell, FileText, LifeBuoy, LogOut, Users } from 'lucide-react';
import ChamadosPage from './pages/ChamadosPage';
import EquipePage from './pages/EquipePage';
import LoginPage from './pages/LoginPage';
import NotificacoesPage from './pages/NotificacoesPage';

const STORAGE_KEY = 'helpdesk-session';

function App() {
  const [activeNav, setActiveNav] = useState('Chamados');
  const [ticketsCount, setTicketsCount] = useState(0);
  const [session, setSession] = useState(() => {
    try {
      const storedSession = localStorage.getItem(STORAGE_KEY);
      return storedSession ? JSON.parse(storedSession) : null;
    } catch {
      return null;
    }
  });

  const isAdmin = session?.role === 'ADMIN';
  const canManageUsers = isAdmin;
  const canViewNotifications = ['CLIENT', 'TECHNICIAN', 'ADMIN'].includes(session?.role || '');

  function handleLogin(newSession) {
    setSession(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setActiveNav('Chamados');
  }

  function handleLogout() {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
    setActiveNav('Chamados');
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const visibleNavItems = [
    { key: 'Chamados', label: 'Chamados', icon: FileText },
    ...(canManageUsers ? [{ key: 'Equipe', label: 'Equipe', icon: Users }] : []),
    ...(canViewNotifications ? [{ key: 'Notificações', label: 'Notificações', icon: Bell }] : []),
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><LifeBuoy size={20} /></span><span>helpdesk<span className="brand-dot">.</span></span></div>

        <nav className="main-nav">
          <p className="nav-caption">Workspace</p>
          {visibleNavItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={activeNav === key ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveNav(key)}
            >
              <Icon size={18} /> {label}
              {key === 'Chamados' && <span className="nav-count">{ticketsCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-avatar">{session.name?.slice(0, 2).toUpperCase() || 'US'}</div>
          <div>
            <strong>{session.name || 'Usuário'}</strong>
            <small>{session.role}</small>
          </div>
          <button className="icon-button" onClick={handleLogout} aria-label="Sair da sessão">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activeNav}</strong>
          </div>

          <div className="top-actions">
            <div className="user-chip">
              <span className="top-avatar">{session.name?.slice(0, 2).toUpperCase() || 'US'}</span>
              <span>{session.name}</span>
            </div>
          </div>
        </header>

        {activeNav === 'Equipe' ? <EquipePage session={session} /> : activeNav === 'Notificações' ? <NotificacoesPage session={session} /> : <ChamadosPage session={session} onTicketsCountChange={setTicketsCount} />}
      </main>
    </div>
  );
}

export default App;
