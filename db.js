const { createClient } = require('@supabase/supabase-js');

// Konfigurasi Project Supabase VMS PLN Pusharlis
const supabaseUrl = process.env.SUPABASE_URL || 'https://ngvvyvsyjucykuiqbsrr.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndnZ5dnN5anVjeWt1aXFic3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1NTE3MjksImV4cCI6MjExMTEyNzcyOX0._Dz3au1jE0bYqkBve5-j2VKldfiFeIqbWBRBfy5FMGg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mengambil seluruh data tamu dari tabel 'visitors'
async function getVisitors() {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .order('tgl', { ascending: false });
  if (error) {
    console.error('Error fetching visitors:', error.message);
    throw error;
  }
  return data;
}

// Menambahkan atau memperbarui data tamu (Upsert) ke tabel 'visitors'
async function upsertVisitor(visitorData) {
  const { data, error } = await supabase
    .from('visitors')
    .upsert(visitorData, { onConflict: 'id' })
    .select();
  if (error) {
    console.error('Error upserting visitor:', error.message);
    throw error;
  }
  return data;
}

// Menghapus data tamu dari tabel 'visitors' berdasarkan ID
async function deleteVisitor(id) {
  const { data, error } = await supabase
    .from('visitors')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting visitor:', error.message);
    throw error;
  }
  return data;
}

module.exports = {
  supabase,
  getVisitors,
  upsertVisitor,
  deleteVisitor
};
