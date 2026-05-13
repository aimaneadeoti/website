import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const defaultExpiration = (days = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export default function AddClientForm({ onAdd, onClose, prefill }) {
  const [form, setForm] = useState({
    name: prefill?.name || '',
    phone: prefill?.phone || '',
    operator: prefill?.operator || 'moov',
    activationDate: today(),
    expirationDate: prefill?.expirationDate ? today() : defaultExpiration(30),
  });
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Le nom est obligatoire');
    if (!form.phone.trim()) return setError('Le numéro est obligatoire');
    if (new Date(form.expirationDate) <= new Date(form.activationDate)) {
      return setError("La date d'expiration doit être après l'activation");
    }
    setError('');
    onAdd({ ...form, name: form.name.trim(), phone: form.phone.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2E4036] rounded-xl flex items-center justify-center">
              <UserPlus size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {prefill ? 'Renouveler' : 'Nouveau client'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du client</label>
            <input
              type="text"
              placeholder="Ex: Mermoz, Dame Sana..."
              value={form.name}
              onChange={set('name')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4036] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Numéro de téléphone</label>
            <input
              type="tel"
              placeholder="07 XX XX XX XX"
              value={form.phone}
              onChange={set('phone')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4036]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Opérateur</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'moov', label: 'MOOV', color: 'bg-blue-500' },
                { value: 'mtn', label: 'MTN', color: 'bg-yellow-500' },
                { value: 'celtis', label: 'CELTIS', color: 'bg-red-500' },
              ].map(op => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, operator: op.value }))}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    form.operator === op.value
                      ? `${op.color} text-white shadow-md scale-105`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Activation</label>
              <input
                type="date"
                value={form.activationDate}
                onChange={set('activationDate')}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4036]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Expiration</label>
              <input
                type="date"
                value={form.expirationDate}
                onChange={set('expirationDate')}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4036]"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#2E4036] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#1e2e26] transition-colors shadow-md"
          >
            {prefill ? '✓ Renouveler' : '+ Enregistrer le client'}
          </button>
        </form>
      </div>
    </div>
  );
}
