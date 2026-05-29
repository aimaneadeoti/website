import { useState } from 'react';
import { getClientStatus } from '../utils/notifications';

const OPERATORS = [
  { key: 'moov', label: 'MOOV', color: '#3b82f6', bg: 'bg-blue-100', text: 'text-blue-800' },
  { key: 'mtn', label: 'MTN', color: '#eab308', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { key: 'celtis', label: 'CELTIS', color: '#ef4444', bg: 'bg-red-100', text: 'text-red-800' },
];

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function DonutChart({ data, total }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 72;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <svg width={size} height={size} className="mx-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="13" fill="#9ca3af">Aucun client</text>
      </svg>
    );
  }

  let offset = 0;
  const segments = data
    .filter(d => d.count > 0)
    .map(d => {
      const dash = (d.count / total) * circumference;
      const seg = { ...d, dash, gap: circumference - dash, offset };
      offset += dash;
      return seg;
    });

  return (
    <svg width={size} height={size} className="mx-auto" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
      {segments.map(seg => (
        <circle key={seg.key} cx={cx} cy={cy} r={r} fill="none"
          stroke={seg.color} strokeWidth={strokeWidth}
          strokeDasharray={`${seg.dash} ${seg.gap}`}
          strokeDashoffset={-seg.offset} strokeLinecap="butt"
        />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="28" fontWeight="bold" fill="#111827"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}>
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#6b7280"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}>
        clients
      </text>
    </svg>
  );
}

export default function StatsView({ clients }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [showPicker, setShowPicker] = useState(false);

  // Collect available years from clients + current year
  const years = [...new Set([
    now.getFullYear(),
    now.getFullYear() - 1,
    ...clients.map(c => new Date(c.activationDate).getFullYear()),
  ])].sort((a, b) => b - a);

  const filtered = clients.filter(c => {
    const d = new Date(c.activationDate);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const total = filtered.length;

  const byOperator = OPERATORS.map(op => ({
    ...op,
    count: filtered.filter(c => c.operator === op.key).length,
    active: filtered.filter(c => c.operator === op.key && getClientStatus(c.expirationDate) === 'active').length,
    expired: filtered.filter(c => c.operator === op.key && getClientStatus(c.expirationDate) === 'expired').length,
  }));

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  return (
    <div className="pt-4">
      {/* Sélecteur de mois cliquable */}
      <button
        onClick={() => setShowPicker(v => !v)}
        className="w-full bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mb-2 text-center active:bg-gray-50 transition-colors"
      >
        <p className="font-bold text-gray-900 text-sm">{MOIS[month]} {year}</p>
        {isCurrentMonth && <p className="text-xs text-[#111827] font-medium">Ce mois-ci</p>}
        <p className="text-xs text-gray-400 mt-0.5">Appuie pour changer</p>
      </button>

      {/* Picker déroulant */}
      {showPicker && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md mb-4 overflow-hidden">
          {years.map(y => (
            <div key={y}>
              <p className="text-xs font-bold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">{y}</p>
              <div className="grid grid-cols-3 gap-1 px-3 pb-3">
                {MOIS.map((m, i) => {
                  const selected = i === month && y === year;
                  return (
                    <button
                      key={i}
                      onClick={() => { setMonth(i); setYear(y); setShowPicker(false); }}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                        selected
                          ? 'bg-[#111827] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}


      <h2 className="text-base font-bold text-gray-800 mb-4">Répartition par opérateur</h2>

      <DonutChart data={byOperator} total={total} />

      <div className="mt-6 space-y-3">
        {byOperator.map(op => {
          const pct = total > 0 ? Math.round((op.count / total) * 100) : 0;
          return (
            <div key={op.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: op.color }} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${op.bg} ${op.text}`}>{op.label}</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{op.count} <span className="text-sm text-gray-400 font-normal">({pct}%)</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: op.color }} />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>✅ {op.active} actifs</span>
                <span>❌ {op.expired} expirés</span>
              </div>
            </div>
          );
        })}
      </div>

      {total === 0 && (
        <p className="text-center text-gray-400 text-sm mt-6">
          Aucun client activé en {MOIS[month]} {year}
        </p>
      )}
    </div>
  );
}
