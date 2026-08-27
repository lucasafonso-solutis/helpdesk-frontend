import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Search, Users, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const roleLabels = { CLIENT: 'Cliente', TECHNICIAN: 'Técnico', ADMIN: 'Administrador' };

function getAuthHeaders() {
  const session = JSON.parse(localStorage.getItem('helpdesk-session') || 'null');
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
}

function formatDate(value) {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(value));
}

function EquipePage({ session }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isLoading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [userModal, setUserModal] = useState(null);
  const [inspectedUser, setInspectedUser] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/users`, {
      headers: getAuthHeaders(),
    })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('API indisponível')))
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setApiError('Não foi possível carregar os usuários do banco de dados.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => users.filter((user) => `${user.name || ''} ${user.email || ''} ${user.id || ''}`.toLowerCase().includes(query.toLowerCase()) && (roleFilter === 'ALL' || user.userRole === roleFilter)), [users, query, roleFilter]);

  async function saveUser(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const editing = userModal.mode === 'edit';
    const response = await fetch(`${API_URL}/users${editing ? `/${userModal.user.id}` : ''}`, {
      method: editing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ name: form.get('name'), email: form.get('email'), userRole: form.get('userRole'), ...(editing ? {} : { passwordHash: form.get('password') }) }),
    });
    if (!response.ok) {
      setApiError('Não foi possível salvar o usuário.');
      return;
    }
    const savedUser = await response.json();
    setUsers((current) => editing ? current.map((user) => user.id === savedUser.id ? savedUser : user) : [...current, savedUser]);
    setUserModal(null);
  }

  async function inspectUser(user) {
    const response = await fetch(`${API_URL}/users/${user.id}`, {
      headers: getAuthHeaders(),
    });
    if (response.ok) setInspectedUser(await response.json());
  }

  async function deactivateUser(user) {
    if (!window.confirm(`Inativar ${user.name}?`)) return;
    const response = await fetch(`${API_URL}/users/${user.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (response.ok) setUsers((current) => current.filter((item) => item.id !== user.id));
    else setApiError('Não foi possível inativar o usuário.');
  }

  return <section className="page-content team-page">
    <div className="page-heading"><div><p className="eyebrow">GESTÃO DE ACESSOS</p><h1>Equipe</h1><p className="subheading">Gerencie clientes, técnicos e administradores.</p></div><button className="primary-button" onClick={() => setUserModal({ mode: 'create' })}>Novo usuário <ArrowUpRight size={17} /></button></div>
    <div className="team-summary"><div><strong>{users.length}</strong><span>usuários ativos</span></div><div><strong>{users.filter((user) => user.userRole === 'TECHNICIAN').length}</strong><span>técnicos</span></div><div><strong>{users.filter((user) => user.userRole === 'CLIENT').length}</strong><span>clientes</span></div><div><strong>{users.filter((user) => user.userRole === 'ADMIN').length}</strong><span>administradores</span></div></div>
    <div className="section-header"><div><h2>Usuários cadastrados</h2><p>Dados carregados do user-service</p></div></div>
    <section className="ticket-panel"><div className="toolbar"><div className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, e-mail ou ID..." /></div><div className="filter-group"><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filtrar por perfil"><option value="ALL">Todos os perfis</option>{Object.entries(roleLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div></div>
      <div className="table-wrap">{apiError ? <div className="empty-state error-state"><Users size={22} /><strong>{apiError}</strong><span>Confirme se o user-service e o banco estão em execução.</span></div> : isLoading ? <div className="empty-state"><Activity size={22} /><strong>Carregando usuários...</strong></div> : filteredUsers.length === 0 ? <div className="empty-state"><Users size={22} /><strong>Nenhum usuário encontrado</strong><span>O user-service não retornou usuários para estes filtros.</span></div> : <table><thead><tr><th>Usuário</th><th>Perfil</th><th>E-mail</th><th>Cadastrado em</th><th>Ações</th></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user.id}><td><div className="user-cell"><span className="user-avatar">{(user.name || '?').slice(0, 2).toUpperCase()}</span><div><strong>{user.name}</strong><small>#{user.id}</small></div></div></td><td><span className={`role-badge ${(user.userRole || '').toLowerCase()}`}>{roleLabels[user.userRole] || user.userRole}</span></td><td>{user.email}</td><td>{formatDate(user.createdAt)}</td><td><div className="user-actions"><button className="small-action" onClick={() => inspectUser(user)}>Consultar</button><button className="small-action" onClick={() => setUserModal({ mode: 'edit', user })}>Editar</button><button className="small-action danger" onClick={() => deactivateUser(user)}>Inativar</button></div></td></tr>)}</tbody></table>}</div>
      <div className="table-footer"><span>Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuários</span></div>
    </section>

    {inspectedUser && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setInspectedUser(null)}><div className="modal user-inspection"><div className="modal-header"><div><p className="eyebrow">CONSULTA DE USUÁRIO</p><h2>{inspectedUser.name}</h2></div><button className="close-button" onClick={() => setInspectedUser(null)} aria-label="Fechar"><X size={20} /></button></div><div className="detail-grid"><div><span>ID</span><strong>#{inspectedUser.id}</strong></div><div><span>Perfil</span><strong>{roleLabels[inspectedUser.userRole] || inspectedUser.userRole}</strong></div><div><span>E-mail</span><strong>{inspectedUser.email}</strong></div><div><span>Status</span><strong>{inspectedUser.active ? 'Ativo' : 'Inativo'}</strong></div><div><span>Criado em</span><strong>{formatDate(inspectedUser.createdAt)}</strong></div></div></div></div>}
    {userModal && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setUserModal(null)}><div className="modal"><div className="modal-header"><div><p className="eyebrow">USER-SERVICE</p><h2>{userModal.mode === 'edit' ? 'Editar usuário' : 'Novo usuário'}</h2></div><button className="close-button" onClick={() => setUserModal(null)} aria-label="Fechar"><X size={20} /></button></div><form onSubmit={saveUser}><label>Nome<input name="name" required defaultValue={userModal.user?.name || ''} placeholder="Nome completo" /></label><label>E-mail<input type="email" name="email" required defaultValue={userModal.user?.email || ''} placeholder="usuario@empresa.com" /></label>{userModal.mode === 'create' && <label>Senha<input type="password" name="password" required minLength="6" placeholder="Senha de acesso" /></label>}<label>Perfil<select name="userRole" defaultValue={userModal.user?.userRole || 'CLIENT'}><option value="CLIENT">Cliente</option><option value="TECHNICIAN">Técnico</option><option value="ADMIN">Administrador</option></select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setUserModal(null)}>Cancelar</button><button type="submit" className="primary-button">Salvar usuário <ArrowUpRight size={17} /></button></div></form></div></div>}
  </section>;
}

export default EquipePage;
