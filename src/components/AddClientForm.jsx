import { useState } from 'react';
import { X, UserPlus, Plus, Trash2 } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const defaultExpiration = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

export default function AddClientForm({ onAdd, onClose, prefill }) {
  const [contact, setContact] = useState(prefill?.contact || prefill?.name || '');
  const [contactPhone, setContactPhone] = useState(prefill?.contactPhone || prefill?.phone || '');
  const [phones, setPhones] = useState(
    prefill ? [prefill.phone] : ['']
  );
  const [operator, setOperator] = useState(prefill?.operator || 'moov');
  const [activationDate, setActivationDate] = useState(today());
  const [expirationDate, setExpirationDate] = useState(defaultExpiration());
  const [error, setError] = useState('');

  const addPhone = () => setPhones(p => [...p, '']);
  const removePhone = (i) => setPhones(p => p.filter((_, idx) => idx !== i));
  const updatePhone = (i, val) => setPhones(p => p.map((v, idx) => idx === i ? val : v));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contact.trim()) return setError('Le nom du contact est obligatoire');
    if (!contactPhone.trim()) return setError('Le numéro du contact est obligatoire');
    const validPhones = phones.map(p => p.trim()).filter(Boolean);
    if (validPhones.length === 0) return setError('Ajoute au moins un numéro à activer');
    if (new Date(expirationDate) <= new Date(activationDate))
      return setError("La date d'expiration doit être après l'activation");
    setError('');

    const records = validPhones.map(phone => ({
      name: contact.trim(),
      phone,
      operator,
      activationDate,
      expirationDate,
      contact: contact.trim(),
      contactPhone: contactPhone.trim(),
    }));
    onAdd(records);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#111827] rounded-xl flex items-center justify-center">
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

            {/* Contact principal */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact principal</p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  placeholder="Ex: Mermoz, Dame Sana..."
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Son numéro WhatsApp</label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-200 border border-r-0 border-gray-200 rounded-l-xl text-sm font-semibold text-gray-600">+229</span>
                  <input
                    type="tel"
                    placeholder="07 XX XX XX XX"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  />
                </div>
              </div>
            </div>

            {/* Numéros à activer */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Numéros à activer</p>
              {phones.map((phone, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex flex-1">
                    <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm font-semibold text-gray-600">+229</span>
                    <input
                      type="tel"
                      placeholder="07 XX XX XX XX"
                      value={phone}
                      onChange={e => updatePhone(i, e.target.value)}
                      className="w-full border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
                    />
                  </div>
                  {phones.length > 1 && (
                    <button type="button" onClick={() => removePhone(i)} className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors shrink-0">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPhone}
                className="flex items-center gap-2 text-sm text-[#111827] font-semibold px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Plus size={16} /> Ajouter un numéro
              </button>
            </div>

            {/* Opérateur */}
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
                    onClick={() => setOperator(op.value)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                      operator === op.value
                        ? `${op.color} text-white shadow-md scale-105`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Activation</label>
                <input
                  type="date"
                  value={activationDate}
                  onChange={e => setActivationDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Expiration</label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={e => setExpirationDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[#111827] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors shadow-md"
            >
              {prefill ? '✓ Renouveler' : `+ Enregistrer${phones.filter(Boolean).length > 1 ? ` (${phones.filter(Boolean).length} numéros)` : ''}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
