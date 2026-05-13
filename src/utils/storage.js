const KEY = 'illimite_clients';

export const getClients = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveClients = (clients) => {
  localStorage.setItem(KEY, JSON.stringify(clients));
};

export const addClient = (client) => {
  const clients = getClients();
  const newClient = { ...client, id: Date.now().toString(), createdAt: new Date().toISOString() };
  clients.push(newClient);
  saveClients(clients);
  return newClient;
};

export const deleteClient = (id) => {
  const clients = getClients().filter(c => c.id !== id);
  saveClients(clients);
  return clients;
};

export const updateClient = (id, updates) => {
  const clients = getClients().map(c => c.id === id ? { ...c, ...updates } : c);
  saveClients(clients);
  return clients;
};
