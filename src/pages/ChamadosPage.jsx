import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowUpRight, CheckCircle2, CircleDot, Clock3,
  FileText, Plus, Search, SlidersHorizontal, X,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const statusLabels = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em atendimento',
  WAITING: 'Aguardando',
  RESOLVED: 'Resolvido',
  CLOSED: 'Encerrado',
};

const priorityLabels = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', CRITICAL: 'Crítica' };
const categoryLabels = { HARDWARE: 'Hardware', SOFTWARE: 'Software', NETWORK: 'Rede' };

function formatDate(value) {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function ticketStatus(ticket) {
  return ticket.ticketStatus || ticket.status || 'UNKNOWN';
}

function ticketCategory(ticket) {
  return ticket.ticketCategory || ticket.category || 'UNKNOWN';
}

function ChamadosPage({ onTicketsCountChange }) {
  const [tickets, setTickets] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/tickets`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('API indisponível')))
      .then((data) => {
        setTickets(Array.isArray(data) ? data : []);
        setApiError('');
      })
      .catch(() => setApiError('Não foi possível carregar os chamados do banco de dados.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    onTicketsCountChange?.(tickets.length);
  }, [tickets.length, onTicketsCountChange]);

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    const matchesQuery = `${ticket.title || ''} ${ticket.id || ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === 'ALL' || ticketStatus(ticket) === statusFilter) && (priorityFilter === 'ALL' || ticket.priority === priorityFilter);
  }), [tickets, query, statusFilter, priorityFilter]);

  const metrics = [
    { label: 'Total de chamados', value: tickets.length, icon: FileText, tone: 'blue' },
    { label: 'Abertos', value: tickets.filter((ticket) => ticketStatus(ticket) === 'OPEN').length, icon: CircleDot, tone: 'amber' },
    { label: 'Em atendimento', value: tickets.filter((ticket) => ticketStatus(ticket) === 'IN_PROGRESS').length, icon: Activity, tone: 'violet' },
    { label: 'Resolvidos', value: tickets.filter((ticket) => ticketStatus(ticket) === 'RESOLVED').length, icon: CheckCircle2, tone: 'green' },
    { label: 'Chamados críticos', value: tickets.filter((ticket) => ticket.priority === 'CRITICAL').length, icon: AlertTriangle, tone: 'red' },
  ];

  async function createTicket(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.get('title'), description: form.get('description'), ticketCategory: form.get('category'), priority: form.get('priority') }),
    });
    if (!response.ok) {
      setApiError('Não foi possível criar o chamado. Verifique os dados e tente novamente.');
      return;
    }
    const createdTicket = await response.json();
    setTickets((current) => [createdTicket, ...current]);
    setApiError('');
    setModalOpen(false);
  }

  function updateTicket(ticket, updates) {
    setPendingChanges((current) => ({ ...current, ...updates }));
    setSelectedTicket((current) => ({ ...current, ...updates, ticketStatus: updates.ticketStatus || current.ticketStatus, priority: updates.ticketPriority || current.priority }));
  }

  async function saveChanges() {
    if (!selectedTicket || Object.keys(pendingChanges).length === 0) return;
    setActionLoading(true);
    try {
      const params = new URLSearchParams();
      if (pendingChanges.ticketStatus) params.set('ticketStatus', pendingChanges.ticketStatus);
      if (pendingChanges.ticketPriority) params.set('ticketPriority', pendingChanges.ticketPriority);
      const response = await fetch(`${API_URL}/tickets/${selectedTicket.id}?${params.toString()}`, { method: 'PUT' });
      if (!response.ok) throw new Error('Falha ao atualizar chamado');
      const updatedTicket = await response.json();
      setTickets((current) => current.map((ticket) => ticket.id === updatedTicket.id ? updatedTicket : ticket));
      setSelectedTicket(updatedTicket);
      setPendingChanges({});
    } catch {
      setApiError('Não foi possível salvar as alterações do chamado.');
    } finally {
      setActionLoading(false);
    }
  }

  async function closeTicket(ticket) {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao encerrar chamado');
      const updatedTicket = await response.json();
      setTickets((current) => current.map((item) => item.id === updatedTicket.id ? updatedTicket : item));
      setSelectedTicket(updatedTicket);
    } catch {
      setApiError('Não foi possível encerrar o chamado.');
    } finally {
      setActionLoading(false);
    }
  }

  return <section className="page-content">
    <div className="page-heading"><div><p className="eyebrow">SEGUNDA-FEIRA, 24 DE AGOSTO DE 2026</p><h1>Central de chamados</h1><p className="subheading">Acompanhe e organize o suporte da sua operação.</p></div><button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={18} /> Novo chamado</button></div>
    <div className="metrics-grid">{metrics.map(({ label, value, icon: Icon, tone }) => <article className="metric-card" key={label}><div className={`metric-icon ${tone}`}><Icon size={19} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong></div></article>)}</div>
    <div className="section-header"><div><h2>Chamados recentes</h2><p>Visão geral da fila de atendimento</p></div><button className="text-button">Ver todos <ArrowUpRight size={16} /></button></div>
    <section className="ticket-panel"><div className="toolbar"><div className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título ou número..." /></div><div className="filter-group"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por status"><option value="ALL">Todos os status</option>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} aria-label="Filtrar por prioridade"><option value="ALL">Todas prioridades</option>{Object.entries(priorityLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select><button className="filter-button" aria-label="Mais filtros"><SlidersHorizontal size={17} /></button></div></div>
      <div className="table-wrap">{apiError ? <div className="empty-state error-state"><AlertTriangle size={22} /><strong>{apiError}</strong><span>Confirme se o gateway e o banco estão em execução.</span></div> : isLoading ? <div className="empty-state"><Activity size={22} /><strong>Carregando chamados...</strong></div> : <><table><thead><tr><th>Chamado</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Atualizado</th><th /></tr></thead><tbody>{filteredTickets.map((ticket) => <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)}><td><div className="ticket-title"><span className="ticket-id">#{ticket.id}</span><strong>{ticket.title}</strong></div></td><td><span className="category-label">{categoryLabels[ticketCategory(ticket)] || ticketCategory(ticket)}</span></td><td><span className={`priority ${(ticket.priority || 'UNKNOWN').toLowerCase()}`}><span />{priorityLabels[ticket.priority] || ticket.priority || 'Não informada'}</span></td><td><span className={`status ${ticketStatus(ticket).toLowerCase()}`}>{statusLabels[ticketStatus(ticket)] || ticketStatus(ticket)}</span></td><td><span className="date-label"><Clock3 size={14} />{formatDate(ticket.updatedAt || ticket.createdAt)}</span></td><td><button className="row-menu" aria-label={`Abrir chamado ${ticket.id}`}>•••</button></td></tr>)}</tbody></table>{filteredTickets.length === 0 && <div className="empty-state"><Search size={22} /><strong>Nenhum chamado encontrado</strong><span>O banco de dados não possui chamados para estes filtros.</span></div>}</>}</div>
      <div className="table-footer"><span>Mostrando <strong>{filteredTickets.length}</strong> de <strong>{tickets.length}</strong> chamados</span><div className="pagination"><button disabled>‹</button><button className="current-page">1</button><button disabled>›</button></div></div>
    </section>

    {isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModalOpen(false)}><div className="modal"><div className="modal-header"><div><p className="eyebrow">NOVO ATENDIMENTO</p><h2>Abrir chamado</h2></div><button className="close-button" onClick={() => setModalOpen(false)} aria-label="Fechar"><X size={20} /></button></div><form onSubmit={createTicket}><label>Título<input name="title" required placeholder="Ex.: Notebook não liga" /></label><label>Descrição<textarea name="description" required placeholder="Descreva o problema com o máximo de detalhes" rows="4" /></label><div className="form-grid"><label>Categoria<select name="category" defaultValue="SOFTWARE"><option value="HARDWARE">Hardware</option><option value="SOFTWARE">Software</option><option value="NETWORK">Rede</option></select></label><label>Prioridade<select name="priority" defaultValue="MEDIUM"><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" className="primary-button">Criar chamado <ArrowUpRight size={17} /></button></div></form></div></div>}
    {selectedTicket && <><button className="confirm-changes-button" disabled={actionLoading || Object.keys(pendingChanges).length === 0} onClick={saveChanges}>{actionLoading ? 'Salvando...' : 'Confirmar alterações'}</button><div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedTicket(null)}><aside className="ticket-drawer"><div className="drawer-header"><div><p className="eyebrow">DETALHES DO CHAMADO</p><h2>#{selectedTicket.id}</h2></div><button className="close-button" onClick={() => setSelectedTicket(null)} aria-label="Fechar detalhes"><X size={20} /></button></div><div className="drawer-title"><span className={`status ${ticketStatus(selectedTicket).toLowerCase()}`}>{statusLabels[ticketStatus(selectedTicket)] || ticketStatus(selectedTicket)}</span><h3>{selectedTicket.title}</h3><p>{selectedTicket.description}</p></div><div className="detail-grid"><div><span>Categoria</span><strong>{categoryLabels[ticketCategory(selectedTicket)] || ticketCategory(selectedTicket)}</strong></div><div><span>Prioridade</span><strong>{priorityLabels[selectedTicket.priority] || selectedTicket.priority}</strong></div><div><span>Criado em</span><strong>{formatDate(selectedTicket.createdAt)}</strong></div><div><span>Atualizado em</span><strong>{formatDate(selectedTicket.updatedAt || selectedTicket.createdAt)}</strong></div></div><div className="drawer-actions"><label>Status<select value={ticketStatus(selectedTicket)} disabled={actionLoading} onChange={(event) => updateTicket(selectedTicket, { ticketStatus: event.target.value })}>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label>Prioridade<select value={selectedTicket.priority || ''} disabled={actionLoading} onChange={(event) => updateTicket(selectedTicket, { ticketPriority: event.target.value })}>{Object.entries(priorityLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><button className="close-ticket-button" disabled={actionLoading || ticketStatus(selectedTicket) === 'CLOSED'} onClick={() => closeTicket(selectedTicket)}><CheckCircle2 size={16} /> Encerrar chamado</button></div></aside></div></>}
  </section>;
}

export default ChamadosPage;
