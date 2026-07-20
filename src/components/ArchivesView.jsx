import { useState, useEffect } from 'react';
import { ArchiveRestore, Archive, Phone, Calendar } from 'lucide-react';
import { getArchivedClients, restoreClient, deleteClient } from '../utils/supabase';

const OPERATOR_COLORS = {
  moov: 'bg-blue-100 text-blue-700',
  mtn: 'bg-yellow-100 text-yellow-700',
  celtis: 'bg-green-100 text-green-700',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ArchivesView({ showToast }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getArchivedClients();
      setClients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (client) => {
    await restoreClient(client.id);
    await load();
    showToast('✅ Client restauré dans la liste');
  };

  const handleDelete = async (client) => {
    if (!confirm(`Supprimer définitivement ${client.name} ? Cette action est irréversible.`)) return;
    await deleteClient(client.id);
    await load();
    showToast('🗑️ Client supprimé définitivement');
  };

  return (
    <div className="mt-4">
      {/* Header info */}
      <div className="bg-gray-100 rounded-2xl p-4 mb-4 flex items-center gap-3">
        <Archive size={28} className="text-gray-500 shrink-0" />
        <div>
          <p className="font-bold text-gray-700">{clients.length} client{clients.length !== 1 ? 's' : ''} archivé{clients.length !== 1 ? 's' : ''}</p>
          <p className="text-xs text-gray-400">Clients qui n'ont pas renouvelé. Restaure-les s'ils reviennent.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Chargement...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <Archive size={44} className="mx-auto mb-2 opacity-25" />
          <p className="font-medium">Aucun client archivé</p>
          <p className="text-xs mt-1">Appuie sur l'icône 📦 sur une carte expirée pour archiver</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(c => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4 opacity-80">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-800 truncate">{c.name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${OPERATOR_COLORS[c.operator] || 'bg-gray-100 text-gray-600'}`}>
                      {c.operator?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                    <Phone size={11} />
                    <span>{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <Calendar size={11} />
                    <span>Expiré le {fmtDate(c.expirationDate)}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleRestore(c)}
                    className="flex items-center gap-1 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <ArchiveRestore size={14} /> Restaurer
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                    title="Supprimer définitivement"
                  >
                    <span className="text-xs">🗑</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
