const NOTIFIED_KEY = 'illimite_notified';

export const requestPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const getClientStatus = (expirationDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const exp = new Date(expirationDate);
  exp.setHours(0, 0, 0, 0);

  if (exp < today) return 'expired';
  if (exp.getTime() === today.getTime()) return 'expires_today';
  if (exp.getTime() === tomorrow.getTime()) return 'expires_tomorrow';
  return 'active';
};

export const checkAndNotify = (clients) => {
  if (Notification.permission !== 'granted') return;

  const todayKey = new Date().toISOString().split('T')[0];
  const notified = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}');

  clients.forEach(client => {
    const status = getClientStatus(client.expirationDate);
    const key = `${client.id}_${todayKey}`;

    if ((status === 'expires_tomorrow' || status === 'expires_today') && !notified[key]) {
      const msg = status === 'expires_today'
        ? `⚠️ Illimité de ${client.name} EXPIRE AUJOURD'HUI !`
        : `⏰ Illimité de ${client.name} expire DEMAIN`;

      new Notification(msg, {
        body: `${client.phone} · ${client.operator.toUpperCase()}`,
        tag: key,
      });

      notified[key] = true;
    }
  });

  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
};

export const getExpiringClients = (clients) => {
  return clients.filter(c => {
    const s = getClientStatus(c.expirationDate);
    return s === 'expires_tomorrow' || s === 'expires_today';
  });
};
