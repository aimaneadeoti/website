import { useState, useEffect } from 'react';
import { Bell, Users, PlusCircle, Search, BellOff, TrendingUp } from 'lucide-react';
import ClientCard from './components/ClientCard';
import AddClientForm from './components/AddClientForm';
import { getClients, addClient, deleteClient } from './utils/storage';
import { requestPermission, checkAndNotify, getExpiringClients, getClientStatus } from './utils/notifications';

const FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'moov', label: 'Moov' },
  { value: 'mtn', label: 'MTN' },
  { value: 'celtis', label: 'Celtis' },
];

export default function App() {
  const [clients, setClients] = useState([]);
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [renewClient, setRenewClient] = useState(null);
  const [notifGranted, setNotifGranted] = useState(false);
  const [alertBanner, setAlertBanner] = useState([]);

  useEffect(() => {
    const data = getClients();
    setClients(data);
    setNotifGranted(Notification.permission === 'granted');
    const expiring = getExpiringClients(data);
    setAlertBanner(expiring);
    if (Notification.permission === 'granted') checkAndNotify(data);
  }, []);

  const handleAdd = (clientData) => {
    addClient(clientData);
    const updated = getClients();
    setClients(updated);
    setAlertBanner(getExpiringClients(updated));
    setShowForm(false);
    setRenewClient(null);
    setView('list');
  };

  const handleDelete = (id) => {
    if (!confirm('Supprimer ce client ?')) return;
    const updated = deleteClient(id);
    setClients(updated);
    setAlertBanner(getExpiringClients(updated));
  };

  const handleRenew = (client) => {
    setRenewClient(client);
    setShowForm(true);
  };

  const handleNotifRequest = async () => {
    const granted = await requestPermission();
    setNotifGranted(granted);
    if (granted) checkAndNotify(clients);
  };

  const filtered = clients
    .filter(c => filter === 'all' || c.operator === filter)
    .filter(c => {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.includes(q);
    })
    .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

  const stats = {
    total: clients.length,
    active: clients.filter(c => getClientStatus(c.expirationDate) === 'active').length,
    expiring: clients.filter(c => ['expires_tomorrow', 'expires_today'].includes(getClientStatus(c.expirationDate))).length,
    expired: clients.filter(c => getClientStatus(c.expirationDate) === 'expired').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Outfit,sans-serif] max-w-lg mx-auto relative">
      {/* Header */}
      <div className="bg-[#2E4036] text-white px-4 pt-10 pb-5 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">IllimiTrack</h1>
            <p className="text-green-200 text-xs">Moov · MTN · Celtis</p>
          </div>
          <button
            onClick={handleNotifRequest}
            className={`p-2.5 rounded-xl transition-colors ${notifGranted ? 'bg-green-700/50 text-green-300' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            title={notifGranted ? 'Notifications activées' : 'Activer les notifications'}
          >
            {notifGranted ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white text-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      <div className="px-4 pb-28">
        {/* Alert banner */}
        {alertBanner.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 mt-4">
            <p className="text-orange-700 text-sm font-semibold mb-1">
              ⚠️ {alertBanner.length} illimité{alertBanner.length > 1 ? 's' : ''} expirent bientôt
            </p>
            {alertBanner.map(c => (
              <p key={c.id} className="text-orange-600 text-xs">
                • {c.name} — {new Date(c.expirationDate).toLocaleDateString('fr-FR')}
              </p>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 mb-4">
          {[
            { label: 'Total', value: stats.total, color: 'bg-[#2E4036] text-white' },
            { label: 'Actifs', value: stats.active, color: 'bg-green-100 text-green-800' },
            { label: 'Bientôt', value: stats.expiring, color: 'bg-orange-100 text-orange-800' },
            { label: 'Expirés', value: stats.expired, color: 'bg-gray-100 text-gray-600' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
              <div className="text-xl font-bold leading-none">{s.value}</div>
              <div className="text-xs opacity-75 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-[#2E4036] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Client list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun client trouvé</p>
            <p className="text-sm mt-1">Appuie sur + pour ajouter</p>
          </div>
        ) : (
          filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onDelete={handleDelete}
              onRenew={handleRenew}
            />
          ))
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-around z-40 shadow-lg">
        <button
          onClick={() => setView('list')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${
            view === 'list' ? 'text-[#2E4036] bg-[#2E4036]/10 font-semibold' : 'text-gray-400'
          }`}
        >
          <Users size={22} />
          <span className="text-xs">Clients</span>
        </button>

        <button
          onClick={() => { setRenewClient(null); setShowForm(true); }}
          className="flex flex-col items-center gap-1 bg-[#2E4036] text-white px-8 py-3 rounded-2xl shadow-md hover:bg-[#1e2e26] transition-colors"
        >
          <PlusCircle size={22} />
          <span className="text-xs font-semibold">Ajouter</span>
        </button>

        <button
          onClick={() => setView('stats')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${
            view === 'stats' ? 'text-[#2E4036] bg-[#2E4036]/10 font-semibold' : 'text-gray-400'
          }`}
        >
          <TrendingUp size={22} />
          <span className="text-xs">Stats</span>
        </button>
      </div>

      {/* Add / Renew form modal */}
      {showForm && (
        <AddClientForm
          onAdd={handleAdd}
          onClose={() => { setShowForm(false); setRenewClient(null); }}
          prefill={renewClient}
        />
      )}
    </div>
  );
}
