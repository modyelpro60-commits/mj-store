const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mzvqyspzrgpjjgqclsfq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dnF5c3B6cmdwampncWNsc2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNjAwMjMsImV4cCI6MjA2MDkzNjAyM30.S8o3XaF4H1p6DxfnP4R8gV9cQYI2FhYl4vzA5Vl7R5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: cols, error: colErr } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'products');
  
  console.log('=== COLUMNS ===');
  cols?.forEach(c => console.log(`${c.column_name} (${c.data_type}) nullable=${c.is_nullable}`));
  if (colErr) console.log('COL ERR:', colErr);

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, image, description, full_description, features');
  
  console.log('\n=== PRODUCTS ===');
  products?.forEach(p => {
    console.log(`\nID ${p.id}: ${p.name}`);
    console.log(`  image: ${JSON.stringify(p.image)}`);
    console.log(`  description: ${JSON.stringify(p.description)}`);
    console.log(`  full_description: ${JSON.stringify(p.full_description)}`);
    console.log(`  features: ${JSON.stringify(p.features)}`);
  });
  if (prodErr) console.log('PROD ERR:', prodErr);
}

main().catch(console.error);
