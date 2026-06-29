import { useState, useEffect } from 'react';
import { Wallet, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDailyBalances, saveDailyBalance, deleteDailyBalance } from '../utils/supabase';

const CATEGORIES = [
  { key: 'momoPay', label: 'Momo Pay' },
  { key: 'moovPay', label: 'Moov Pay' },
  { key: 'moovCredit', label: 'Compte crédit (Moov)' },
  { key: 'momoOrdi', label: 'Momo Ordi' },
  { key: 'moovOrdi', label: 'Moov Ordi' },
  { key: 'celtis', label: 'Celtis' },
];

const todayStr = () => new Date().toISOString().split('T')[0];
const fmt = (n) => n.toLocaleString('fr-FR') + ' F';
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' });

const emptyForm = (date) => ({
  date,
  momoPay: '', moovPay: '', moovCredit: '', momoOrdi: '', moovOrdi: '', celtis: '', imprevu: '',
});

const computeTotal = (b) =>
  CATEGORIES.reduce((s, c) => s + (Number(b[c.key]) || 0), 0) - (Number(b.imprevu) || 0);

export default function CaisseView() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [form, setForm] = useState(emptyForm(todayStr()));
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await getDailyBalances();
      setBalances(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const existing = balances.find(b => b.date === date);
    if (existing) {
      setForm({
        date,
        momoPay: existing.momoPay || '',
        moovPay: existing.moovPay || '',
        moovCredit: existing.moovCredit || '',
        momoOrdi: existing.momoOrdi || '',
        moovOrdi: existing.moovOrdi || '',
        celtis: existing.celtis || '',
        imprevu: existing.imprevu || '',
      });
    } else {
      setForm(emptyForm(date));
    }
  }, [date, balances]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const total = computeTotal(form);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDailyBalance(form);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce point de caisse ?')) return;
    await deleteDailyBalance(id);
    await load();
  };

  const shiftDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const monthTotal = balances
    .filter(b => b.date.slice(0, 7) === todayStr().slice(0, 7))
    .reduce((s, b) => s + computeTotal(b), 0);

  return (
    <div className="pt-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-[#111827] rounded-xl flex items-center justify-center">
          <Wallet size={16} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Point de caisse</h2>
      </div>

      {/* Sélecteur de date */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-2 mb-4">
        <button onClick={() => shiftDate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <div className="flex-1 text-center">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="text-center font-semibold text-gray-900 text-sm bg-transparent focus:outline-none capitalize"
          />
        </div>
        <button onClick={() => shiftDate(1)} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 mb-3">
        {CATEGORIES.map(cat => (
          <div key={cat.key}>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{cat.label}</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={form[cat.key]}
              onChange={set(cat.key)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-semibold text-red-500 mb-1">Imprévu (sera soustrait)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={form.imprevu}
            onChange={set('imprevu')}
            className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
      </div>

      {/* Total + enregistrer */}
      <div className="bg-[#111827] rounded-2xl p-4 flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-white/70 font-semibold">Total du jour</p>
          <p className="text-xl font-bold text-white">{fmt(total)}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-white text-[#111827] px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
        >
          {saving ? '...' : '✓ Enregistrer'}
        </button>
      </div>

      {/* Total du mois */}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-center mb-5">
        <p className="text-xs font-semibold text-green-700 opacity-80">Total ce mois-ci</p>
        <p className="text-sm font-bold mt-0.5 text-green-700">{fmt(monthTotal)}</p>
      </div>

      {/* Historique */}
      <h2 className="text-base font-bold text-gray-800 mb-3">Historique</h2>
      {loading ? (
        <p className="text-center text-gray-400 text-sm py-6">Chargement...</p>
      ) : balances.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">Aucun point de caisse enregistré</p>
      ) : (
        <div className="space-y-2">
          {balances.map(b => (
            <div key={b.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between">
              <button className="text-left" onClick={() => setDate(b.date)}>
                <p className="text-sm font-semibold text-gray-800 capitalize">{fmtDate(b.date)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmt(computeTotal(b))}</p>
              </button>
              <button onClick={() => handleDelete(b.id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
