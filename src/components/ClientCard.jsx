import { useState } from 'react';
import { Trash2, Phone, Calendar, RefreshCw, MessageCircle, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import { getClientStatus } from '../utils/notifications';

const OPERATOR_STYLES = {
  moov: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'MOOV' },
  mtn: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'MTN' },
  celtis: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'CELTIS' },
};

const STATUS_STYLES = {
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif', pulse: false },
  expires_tomorrow: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Expire demain', pulse: true },
  expires_today: { bg: 'bg-red-100', text: 'text-red-700', label: "Expire aujourd'hui", pulse: true },
  expired: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Expiré', pulse: false },
};

const fmt = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtShort = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

const formatPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00229')) return digits.slice(2);
  if (digits.startsWith('229')) return digits;
  if (digits.length <= 8) return '22901' + digits;
  return '229' + digits;
};

const buildWhatsAppMessage = (client, status) => {
  const op = client.operator.toUpperCase();
  const contactName = client.contact || client.name;
  const date = fmtShort(client.expirationDate);
  const phone = client.phone;

  const expiry = status === 'expired'
    ? `s'est expiré depuis le *${date}*`
    : `expire le *${date}*`;

  const body = `Votre illimité : *${op}* activé sur le numéro : *${phone}* ${expiry}. Souhaitez-vous le renouveler ? 📶`;
  const msg = `*Bonjour chers clients : ${contactName} !* 👋\n\n${body}`;
  return encodeURIComponent(msg);
};

export default function ClientCard({ client, onDelete, onRenew, onAddNumber }) {
  const status = getClientStatus(client.expirationDate);
  const op = OPERATOR_STYLES[client.operator] || OPERATOR_STYLES.moov;
  const st = STATUS_STYLES[status];
  const showWhatsApp = status === 'expires_tomorrow' || status === 'expires_today' || status === 'expired';
  const [showWaPicker, setShowWaPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Use contact phone for WhatsApp if available, else activation phone
  const whatsappPhone = client.contactPhone || client.phone;
  const isSecondary = client.contactPhone && client.contactPhone !== client.phone;

  const openWhatsApp = (business) => {
    const phone = formatPhone(whatsappPhone);
    const msg = buildWhatsAppMessage(client, status);
    const url = business
      ? `https://wa.me/${phone}?text=${msg}`
      : `whatsapp://send?phone=${phone}&text=${msg}`;
    window.open(url, '_blank');
    setShowWaPicker(false);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${status === 'expired' ? 'border-gray-200 opacity-70' : status === 'expires_tomorrow' || status === 'expires_today' ? 'border-orange-300' : 'border-gray-100'} mb-3 overflow-hidden`}>
      <div className="flex items-start justify-between gap-2 p-4">
        {/* Left: info — cliquable pour historique */}
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => client.history?.length > 0 && setShowHistory(v => !v)}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${op.bg} ${op.text}`}>
              {op.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${st.bg} ${st.text}`}>
              {st.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current pulse-dot inline-block" />}
              {st.label}
            </span>
          </div>

          <h3 className="font-bold text-gray-900 text-base truncate">{client.name}</h3>

          <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
            <Phone size={13} />
            <span>{client.phone}</span>
            {isSecondary && (
              <span className="ml-1 text-xs bg-purple-100 text-purple-600 font-medium px-1.5 py-0.5 rounded-full">
                via {client.contact}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
            <Calendar size={13} />
            <span>
              {fmtShort(client.activationDate)} →{' '}
              <strong className={
                status === 'expires_tomorrow' || status === 'expires_today' ? 'text-orange-600'
                : status === 'expired' ? 'text-gray-400'
                : 'text-gray-700'
              }>
                {fmtShort(client.expirationDate)}
              </strong>
            </span>
          </div>

          {client.history?.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
              {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{client.history.length} renouvellement{client.history.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </button>

        {/* Right: actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {showWhatsApp && (
            <div className="relative">
              <button
                onClick={() => setShowWaPicker(v => !v)}
                className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                title="Rappel WhatsApp"
              >
                <MessageCircle size={16} />
              </button>
              {showWaPicker && (
                <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden w-44">
                  <button
                    onClick={() => openWhatsApp(false)}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>💬</span> WhatsApp
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    onClick={() => openWhatsApp(true)}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>💼</span> WhatsApp Business
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => onAddNumber(client)}
            className="p-2 rounded-xl bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors"
            title="Ajouter un numéro"
          >
            <PlusCircle size={16} />
          </button>
          <button
            onClick={() => onRenew(client)}
            className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            title="Renouveler"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => onDelete(client.id)}
            className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Historique des renouvellements */}
      {showHistory && client.history?.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 mb-2">Historique des plans</p>
          {[...client.history].reverse().map((entry, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-gray-500 bg-white rounded-xl px-3 py-2 border border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar size={11} className="text-gray-400" />
                <span>{fmtShort(entry.activationDate)} → {fmtShort(entry.expirationDate)}</span>
              </div>
              <span className="text-gray-300">renouvelé le {new Date(entry.renewedAt).toLocaleDateString('fr-FR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
