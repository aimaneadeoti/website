import { useState, useEffect } from 'react';
import { CheckCircle, Plus, X, AlertCircle } from 'lucide-react';
import { getCreances, addCreance, deleteCreance } from '../utils/supabase';

export default function CreancesView({ showToast }) {
  const [creances, setCreances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await getCreances();
      setCreances(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Le nom est obligatoire');
    if (!amount || Number(amount) <= 0) return setError('Montant invalide');
    setError('');
    await addCreance({ name: name.trim(), amount: Number(amount), comment: comment.trim() });
    setName(''); setAmount(''); setComment('');
    setShowForm(false);
    await load();
    showToast('✅ Créance ajoutée');
  };

  const handlePaid = async (id, name) => {
    if (!confirm(`Marquer ${name} comme payé et retirer de la liste ?`)) return;
    await deleteCreance(id);
    await load();
    showToast('✅ Payé — retiré de la liste');
  };

  const total = creances.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="mt-4">
      {/* Total */}
      <div className="bg-[#111827] text-white rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">Total dû</p>
          <p className="text-2xl font-bold">{total.toLocaleString('fr-FR')} F</p>
        </div>
        <AlertCircle size={32} className="text-orange-400 opacity-80" />
      </div>

      {/* Bouton ajouter */}
      <button
        onClick={() => setShowForm(v => !v)}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-semibold text-sm mb-4 hover:bg-orange-600 transition-colors"
      >
        <Plus size={18} /> Ajouter une créance
      </button>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom</label>
              <input
                type="text"
                placeholder="Ex: Kouassi, Mermoz..."
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Montant (F CFA)</label>
              <input
                type="number"
                min="0"
                placeholder="Ex: 5000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Commentaire (optionnel)</label>
              <input
                type="text"
                placeholder="Ex: illimité du 01/07, reste à payer..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
              />
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-[#111827] text-white py-2.5 rounded-xl text-sm font-semibold">
                Enregistrer
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200">
                <X size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Chargement...</div>
      ) : creances.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle size={40} className="mx-auto mb-2 opacity-30" />
          <p className="font-medium">Aucune créance en cours</p>
          <p className="text-sm mt-1">Tout le monde a payé 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {creances.map(c => (
            <div key={c.id} className="bg-white border border-orange-100 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-gray-900 truncate">{c.name}</p>
                  <span className="shrink-0 text-sm font-bold text-orange-600">
                    {Number(c.amount).toLocaleString('fr-FR')} F
                  </span>
                </div>
                {c.comment && (
                  <p className="text-xs text-gray-400 truncate">{c.comment}</p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">
                  {new Date(c.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button
                onClick={() => handlePaid(c.id, c.name)}
                className="shrink-0 flex items-center gap-1.5 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                <CheckCircle size={15} /> Payé
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
