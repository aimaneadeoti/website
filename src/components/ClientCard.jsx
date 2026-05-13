import { Trash2, Phone, Calendar, RefreshCw } from 'lucide-react';
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

const fmt = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export default function ClientCard({ client, onDelete, onRenew }) {
  const status = getClientStatus(client.expirationDate);
  const op = OPERATOR_STYLES[client.operator] || OPERATOR_STYLES.moov;
  const st = STATUS_STYLES[status];

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border ${status === 'expired' ? 'border-gray-200 opacity-70' : status === 'expires_tomorrow' || status === 'expires_today' ? 'border-orange-300' : 'border-gray-100'} mb-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
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
          </div>

          <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
            <Calendar size={13} />
            <span>{fmt(client.activationDate)} → <strong className={status === 'expires_tomorrow' || status === 'expires_today' ? 'text-orange-600' : status === 'expired' ? 'text-gray-400' : 'text-gray-700'}>{fmt(client.expirationDate)}</strong></span>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
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
    </div>
  );
}
