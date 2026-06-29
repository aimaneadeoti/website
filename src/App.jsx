import { useState, useEffect } from 'react';
import { Bell, Users, PlusCircle, Search, BellOff, TrendingUp, LogOut, Wallet, Download } from 'lucide-react';
import ClientCard from './components/ClientCard';
import AddClientForm from './components/AddClientForm';
import AddNumberModal from './components/AddNumberModal';
import StatsView from './components/StatsView';
import CaisseView from './components/CaisseView';
import AuthPage from './components/AuthPage';
import { getClients, addClient, renewClient as renewClientInDb, deleteClient, supabase, getDailyBalances } from './utils/supabase';
import { requestPermission, checkAndNotify, checkAndNotifyNotRenewed, getExpiringClients, getNotRenewedClients, getClientStatus } from './utils/notifications';

const FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'moov', label: 'Moov' },
  { value: 'mtn', label: 'MTN' },
  { value: 'celtis', label: 'Celtis' },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clients, setClients] = useState([]);
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [renewClient, setRenewClient] = useState(null);
  const [addNumberClient, setAddNumberClient] = useState(null);
  const [notifGranted, setNotifGranted] = useState(false);
  const [alertBanner, setAlertBanner] = useState([]);
  const [notRenewedBanner, setNotRenewedBanner] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setClients([]);
  };

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
      const expiring = getExpiringClients(data);
      const notRenewed = getNotRenewedClients(data);
      setAlertBanner(expiring);
      setNotRenewedBanner(notRenewed);
      if (Notification.permission === 'granted') {
        checkAndNotify(data);
        checkAndNotifyNotRenewed(data);
      }
      if (navigator.serviceWorker?.controller)
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_CLIENTS', clients: data });
      if (expiring.length > 0 && navigator.vibrate)
        navigator.vibrate([200, 100, 200, 100, 200]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      setNotifGranted(Notification.permission === 'granted');
      loadClients();
    }
  }, [session]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddAll = async (allClients) => {
    await Promise.all(allClients.map(c => addClient(c)));
    await loadClients();
    setShowForm(false);
    setView('list');
    const n = allClients.length;
    showToast(`✅ ${n > 1 ? `${n} numéros ajoutés` : 'Client ajouté'} avec succès`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce client ?')) return;
    await deleteClient(id);
    await loadClients();
  };

  const handleRenew = (client) => {
    setRenewClient(client);
    setShowForm(true);
  };

  const handleAddNumber = async (records) => {
    await Promise.all(records.map(c => addClient(c)));
    await loadClients();
    setAddNumberClient(null);
    const n = records.length;
    showToast(`✅ ${n > 1 ? `${n} numéros ajoutés` : 'Numéro ajouté'} avec succès`);
  };

  const handleRenewSubmit = async (clientData, originalClient) => {
    await renewClientInDb(originalClient, clientData);
    await loadClients();
    setShowForm(false);
    setRenewClient(null);
    showToast('✅ Renouvellement effectué avec succès');
  };

  const handleNotifRequest = async () => {
    const granted = await requestPermission();
    setNotifGranted(granted);
    if (granted) checkAndNotify(clients);
  };

  const handleExportData = async () => {
    const balances = await getDailyBalances();
    const blob = new Blob([JSON.stringify({ clients, balances }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kkt-store-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  if (!authChecked) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );

  if (!session) return <AuthPage onLogin={() => {}} />;

  return (
    <div className="min-h-screen bg-gray-50 font-[Outfit,sans-serif] max-w-lg mx-auto relative">
      {/* Header */}
      <div className="bg-[#111827] text-white px-4 pt-10 pb-5 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">KKT Store</h1>
            <p className="text-gray-400 text-xs">Illimité Track · Moov · MTN · Celtis</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportData}
              className="p-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              title="Exporter mes données"
            >
              <Download size={20} />
            </button>
            <button
              onClick={handleNotifRequest}
              className={`p-2.5 rounded-xl transition-colors ${notifGranted ? 'bg-green-700/50 text-green-300' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              title={notifGranted ? 'Notifications activées' : 'Activer les notifications'}
            >
              {notifGranted ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              title="Déconnexion"
            >
              <LogOut size={20} />
            </button>
          </div>
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
        {/* Alert banner — expire bientôt */}
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

        {/* Alert banner — pas encore renouvelé */}
        {notRenewedBanner.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mt-3">
            <p className="text-red-700 text-sm font-semibold mb-1">
              🔴 {notRenewedBanner.length} client{notRenewedBanner.length > 1 ? 's' : ''} n'ont pas encore renouvelé
            </p>
            {notRenewedBanner.map(c => {
              const days = Math.round((new Date().setHours(0,0,0,0) - new Date(c.expirationDate).setHours(0,0,0,0)) / (1000*60*60*24));
              return (
                <p key={c.id} className="text-red-600 text-xs">
                  • {c.name} — expiré depuis {days} jour{days > 1 ? 's' : ''}
                </p>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 mb-4">
          {[
            { label: 'Total', value: stats.total, color: 'bg-[#111827] text-white' },
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
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats view */}
        {view === 'stats' && <StatsView clients={clients} />}

        {/* Caisse view */}
        {view === 'caisse' && <CaisseView />}

        {/* Client list */}
        {view !== 'stats' && view !== 'caisse' && (loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
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
              onAddNumber={(c) => setAddNumberClient(c)}
            />
          ))
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-around z-40 shadow-lg">
        <button
          onClick={() => setView('list')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${
            view === 'list' ? 'text-[#111827] bg-[#111827]/10 font-semibold' : 'text-gray-400'
          }`}
        >
          <Users size={22} />
          <span className="text-xs">Clients</span>
        </button>

        <button
          onClick={() => setView('caisse')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
            view === 'caisse' ? 'text-[#111827] bg-[#111827]/10 font-semibold' : 'text-gray-400'
          }`}
        >
          <Wallet size={22} />
          <span className="text-xs">Caisse</span>
        </button>

        <button
          onClick={() => { setRenewClient(null); setShowForm(true); }}
          className="flex flex-col items-center gap-1 bg-[#111827] text-white px-6 py-3 rounded-2xl shadow-md hover:bg-[#1e2e26] transition-colors"
        >
          <PlusCircle size={22} />
          <span className="text-xs font-semibold">Ajouter</span>
        </button>

        <button
          onClick={() => setView('stats')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${
            view === 'stats' ? 'text-[#111827] bg-[#111827]/10 font-semibold' : 'text-gray-400'
          }`}
        >
          <TrendingUp size={22} />
          <span className="text-xs">Stats</span>
        </button>
      </div>

      {/* Add / Renew form modal */}
      {showForm && (
        <AddClientForm
          onAdd={renewClient
            ? (records) => handleRenewSubmit(records[0], renewClient)
            : handleAddAll}
          onClose={() => { setShowForm(false); setRenewClient(null); }}
          prefill={renewClient}
        />
      )}

      {/* Add number modal */}
      {addNumberClient && (
        <AddNumberModal
          client={addNumberClient}
          onAdd={handleAddNumber}
          onClose={() => setAddNumberClient(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
