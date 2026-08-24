import { useEffect, useMemo, useState } from 'react';
import { Activity, Bell, Search, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const eventLabels = {
  TICKET_CREATED: 'Chamado criado',
  TICKET_ASSIGNED: 'Técnico atribuído',
  TICKET_STATUS_CHANGED: 'Status alterado',
};

function formatDate(value) {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function NotificacoesPage() {
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [isLoading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [inspectedNotification, setInspectedNotification] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/notifications`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('API indisponível')))
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setApiError('Não foi possível carregar as notificações do banco de dados.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredNotifications = useMemo(() => notifications.filter((notification) => `${notification.message || ''} ${notification.ticketId || ''}`.toLowerCase().includes(query.toLowerCase()) && (eventFilter === 'ALL' || notification.eventType === eventFilter)), [notifications, query, eventFilter]);

  return <section className="page-content notifications-page">
    <div className="page-heading"><div><p className="eyebrow">CENTRAL DE EVENTOS</p><h1>Notificações</h1><p className="subheading">Acompanhe os eventos processados pela operação.</p></div></div>
    <div className="section-header"><div><h2>Histórico de notificações</h2><p>Registros de notificações</p></div></div>
    <section className="ticket-panel"><div className="toolbar"><div className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por mensagem ou chamado..." /></div><div className="filter-group"><select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} aria-label="Filtrar por evento"><option value="ALL">Todos os eventos</option>{Object.entries(eventLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div></div>
      <div className="table-wrap">{apiError ? <div className="empty-state error-state"><Bell size={22} /><strong>{apiError}</strong><span>Confirme se o notification-service e o banco estão em execução.</span></div> : isLoading ? <div className="empty-state"><Activity size={22} /><strong>Carregando notificações...</strong></div> : filteredNotifications.length === 0 ? <div className="empty-state"><Bell size={22} /><strong>Nenhuma notificação encontrada</strong><span>O notification-service não retornou registros para estes filtros.</span></div> : <table><thead><tr><th>Evento</th><th>Chamado</th><th>Mensagem</th><th>Status</th><th>Data</th></tr></thead><tbody>{filteredNotifications.map((notification) => <tr key={notification.id} onClick={() => setInspectedNotification(notification)}><td><span className="event-badge">{eventLabels[notification.eventType] || notification.eventType}</span></td><td>#{notification.ticketId || '—'}</td><td className="notification-message">{notification.message || 'Sem mensagem'}</td><td><span className={`status ${(notification.status || 'UNKNOWN').toLowerCase()}`}>{notification.status || 'Não informado'}</span></td><td>{formatDate(notification.createdAt)}</td></tr>)}</tbody></table>}</div>
      <div className="table-footer"><span>Mostrando <strong>{filteredNotifications.length}</strong> de <strong>{notifications.length}</strong> notificações</span></div>
    </section>
    {inspectedNotification && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setInspectedNotification(null)}><div className="modal notification-inspection"><div className="modal-header"><div><p className="eyebrow">DETALHES DO EVENTO</p><h2>Notificação #{inspectedNotification.id}</h2></div><button className="close-button" onClick={() => setInspectedNotification(null)} aria-label="Fechar"><X size={20} /></button></div><div className="detail-grid"><div><span>Evento</span><strong>{eventLabels[inspectedNotification.eventType] || inspectedNotification.eventType}</strong></div><div><span>Chamado</span><strong>#{inspectedNotification.ticketId || 'Não informado'}</strong></div><div><span>Status</span><strong>{inspectedNotification.status || 'Não informado'}</strong></div><div><span>Mensagem</span><strong>{inspectedNotification.message || 'Sem mensagem'}</strong></div><div><span>Message ID</span><strong>{inspectedNotification.messageId || 'Não informado'}</strong></div><div><span>Criado em</span><strong>{formatDate(inspectedNotification.createdAt)}</strong></div></div></div></div>}
  </section>;
}

export default NotificacoesPage;
