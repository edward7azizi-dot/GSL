import { supabase } from '@/lib/supabaseClient';

// Chat/announcement components reference msg.created_date (Base44 naming).
// Supabase uses created_at. Add an alias so existing UI code works unchanged.
const normalize = (row) =>
  row && !row.created_date ? { ...row, created_date: row.created_at } : row;
const normalizeList = (rows) => (rows || []).map(normalize);

// Base44 sort format: "-created_date" = descending, "date" = ascending
const applySort = (query, sort) => {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  const col = (desc ? sort.slice(1) : sort).replace('created_date', 'created_at');
  return query.order(col, { ascending: !desc });
};

// Factory: creates entity objects with the same API surface as base44.entities.*
const makeEntity = (table) => ({
  async list(sort, limit) {
    let q = supabase.from(table).select('*');
    if (sort) q = applySort(q, sort);
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return normalizeList(data);
  },

  async filter(filters, sort, limit) {
    let q = supabase.from(table).select('*').match(filters);
    if (sort) q = applySort(q, sort);
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return normalizeList(data);
  },

  async create(data) {
    const { data: row, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return normalize(row);
  },

  async update(id, data) {
    const { data: row, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return normalize(row);
  },

  async delete(id) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  },
});

export const Team         = makeEntity('teams');
export const Game         = makeEntity('games');
export const Player       = makeEntity('players');
export const Location     = makeEntity('locations');
export const Media        = makeEntity('media');
export const ChatMessage  = makeEntity('chat_messages');
export const Announcement = makeEntity('announcements');
