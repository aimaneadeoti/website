import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wubhngfsnhhircryurfn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YmhuZ2ZzbmhoaXJjcnl1cmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MzUwNTgsImV4cCI6MjA5NDMxMTA1OH0.abE2a7iDX79my0gTawn3rJ38-HPx61RCaP3Bk20zHDo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const toRow = (c) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  operator: c.operator,
  activation_date: c.activationDate,
  expiration_date: c.expirationDate,
  created_at: c.createdAt,
  contact: c.contact || null,
  contact_phone: c.contactPhone || null,
  price: c.price || 0,
});

const fromRow = (r) => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  operator: r.operator,
  activationDate: r.activation_date,
  expirationDate: r.expiration_date,
  createdAt: r.created_at,
  history: r.history || [],
  contact: r.contact || null,
  contactPhone: r.contact_phone || null,
  price: r.price || 0,
});

export async function getClients() {
  const { data, error } = await supabase.from('clients').select('*').order('expiration_date');
  if (error) throw error;
  return data.map(fromRow);
}

export async function addClient(client) {
  const { data: { user } } = await supabase.auth.getUser();
  const newClient = { ...client, id: Date.now().toString(), createdAt: new Date().toISOString() };
  const { error } = await supabase.from('clients').insert({ ...toRow(newClient), user_id: user.id });
  if (error) throw error;
  return newClient;
}

export async function renewClient(existingClient, newDates) {
  const historyEntry = {
    activationDate: existingClient.activationDate,
    expirationDate: existingClient.expirationDate,
    renewedAt: new Date().toISOString(),
  };
  const updatedHistory = [...existingClient.history, historyEntry];
  const { error } = await supabase.from('clients').update({
    activation_date: newDates.activationDate,
    expiration_date: newDates.expirationDate,
    history: updatedHistory,
  }).eq('id', existingClient.id);
  if (error) throw error;
}

export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

const toBalanceRow = (b) => ({
  date: b.date,
  momo_pay: b.momoPay || 0,
  moov_pay: b.moovPay || 0,
  moov_credit: b.moovCredit || 0,
  momo_ordi: b.momoOrdi || 0,
  moov_ordi: b.moovOrdi || 0,
  celtis: b.celtis || 0,
  imprevu: b.imprevu || 0,
});

const fromBalanceRow = (r) => ({
  id: r.id,
  date: r.date,
  momoPay: r.momo_pay,
  moovPay: r.moov_pay,
  moovCredit: r.moov_credit,
  momoOrdi: r.momo_ordi,
  moovOrdi: r.moov_ordi,
  celtis: r.celtis,
  imprevu: r.imprevu,
});

export async function getDailyBalances() {
  const { data, error } = await supabase.from('daily_balance').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data.map(fromBalanceRow);
}

export async function saveDailyBalance(balance) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('daily_balance')
    .upsert({ ...toBalanceRow(balance), user_id: user.id }, { onConflict: 'user_id,date' });
  if (error) throw error;
}

export async function deleteDailyBalance(id) {
  const { error } = await supabase.from('daily_balance').delete().eq('id', id);
  if (error) throw error;
}

export async function getCreances() {
  const { data, error } = await supabase.from('creances').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addCreance(creance) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('creances').insert({
    user_id: user.id,
    name: creance.name,
    amount: creance.amount,
    comment: creance.comment || null,
  });
  if (error) throw error;
}

export async function deleteCreance(id) {
  const { error } = await supabase.from('creances').delete().eq('id', id);
  if (error) throw error;
}
