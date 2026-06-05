const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://njnyktdputuhdqrzztvf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qbnlrdGRwdXR1aGRxcnp6dHZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA3OTgwNSwiZXhwIjoyMDk1NjU1ODA1fQ.aPwcH8mJwsia_PFGv8c8avxOgCy8eiq6i0MiEzk7wDY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // 1. Check current state of update-order-status route file
  console.log('=== STEP 1: Check what status values exist in orders table ===');
  const { data: statuses, error: statusErr } = await supabase.from('orders').select('status').limit(5);
  if (statusErr) { console.log('ERROR:', statusErr); return; }
  console.log('Sample statuses in DB:', JSON.stringify(statuses));

  // 2. Check what columns orders has
  console.log('\n=== STEP 2: Check orders table columns ===');
  const { data: orderSample, error: sampleErr } = await supabase.from('orders').select('*').limit(1);
  if (sampleErr) { console.log('ERROR:', sampleErr); return; }
  console.log('Order columns:', orderSample.length > 0 ? Object.keys(orderSample[0]) : 'no rows');
  if (orderSample.length > 0) console.log('Sample:', JSON.stringify(orderSample[0], null, 2));

  // 3. Check if there are any orders with product_id
  console.log('\n=== STEP 3: Check for orders with non-null product_id ===');
  const { data: ordersWithProduct, error: prodErr } = await supabase.from('orders').select('id, status, product_id').not('product_id', 'is', null).limit(5);
  if (prodErr) { console.log('ERROR:', prodErr); return; }
  console.log('Orders with product_id:', JSON.stringify(ordersWithProduct, null, 2));

  // 4. Get a product to track sales_count
  console.log('\n=== STEP 4: Check a product before any test ===');
  const { data: products, error: pErr } = await supabase.from('products').select('id, name, sales_count').limit(5);
  if (pErr) { console.log('ERROR:', pErr); return; }
  console.log('Products:', JSON.stringify(products, null, 2));

  // 5. Test: create an order, then simulate status change to Completed
  console.log('\n=== STEP 5: Find an order to test with ===');
  // Find a non-completed order with product_id
  const { data: testOrder } = await supabase.from('orders').select('id, status, product_id').not('product_id', 'is', null).neq('status', 'Completed').limit(1);
  if (!testOrder || testOrder.length === 0) {
    console.log('No testable order found. Creating one...');
    // Get a product
    const { data: prod } = await supabase.from('products').select('id, name, price').limit(1);
    if (!prod || prod.length === 0) { console.log('No products exist'); return; }
    
    const { data: newOrder, error: createErr } = await supabase.from('orders').insert([{
      customer_name: 'Test User',
      customer_phone: '01000000000',
      product_id: prod[0].id,
      product_name: prod[0].name,
      price: prod[0].price,
      status: 'Pending'
    }]).select('id, status, product_id').single();
    
    if (createErr) { console.log('Create order error:', createErr); return; }
    console.log('Created test order:', JSON.stringify(newOrder));
    
    // Now get the product sales_count before
    const { data: prodBefore } = await supabase.from('products').select('sales_count').eq('id', prod[0].id).single();
    console.log('Product sales_count before:', prodBefore?.sales_count);
    
    // Simulate what update-order-status does:
    // fetch order
    const { data: fetched } = await supabase.from('orders').select('status, product_id').eq('id', newOrder.id).single();
    console.log('Fetched order:', JSON.stringify(fetched));
    
    // Check if status transition qualifies
    const isBecoming = 'Completed' === 'Completed' && fetched.status !== 'Completed';
    console.log('Is becoming completed?', isBecoming);
    
    if (isBecoming && fetched.product_id != null) {
      // Increment
      const { data: prodCurrent } = await supabase.from('products').select('sales_count').eq('id', fetched.product_id).single();
      console.log('Current sales_count:', prodCurrent?.sales_count);
      const newSales = Number(prodCurrent?.sales_count || 0) + 1;
      const { error: updErr } = await supabase.from('products').update({ sales_count: newSales }).eq('id', fetched.product_id);
      if (updErr) console.log('Update error:', updErr);
      else console.log('Updated sales_count to:', newSales);
      
      // Update order status
      const { error: ordUpd } = await supabase.from('orders').update({ status: 'Completed' }).eq('id', newOrder.id);
      if (ordUpd) console.log('Order update error:', ordUpd);
      else console.log('Order status updated to Completed');
      
      // Verify
      const { data: prodAfter } = await supabase.from('products').select('sales_count').eq('id', fetched.product_id).single();
      console.log('Product sales_count AFTER:', prodAfter?.sales_count);
    }
  } else {
    console.log('Found testable order:', JSON.stringify(testOrder[0]));
    
    const { data: prodBefore } = await supabase.from('products').select('sales_count').eq('id', testOrder[0].product_id).single();
    console.log('Product sales_count before:', prodBefore?.sales_count);
    
    const isBecoming = true; // we only picked non-completed orders
    if (isBecoming && testOrder[0].product_id != null) {
      const newSales = Number(prodBefore?.sales_count || 0) + 1;
      const { error: updErr } = await supabase.from('products').update({ sales_count: newSales }).eq('id', testOrder[0].product_id);
      if (updErr) console.log('Update error:', updErr);
      else console.log('Updated sales_count to:', newSales);
      
      const { error: ordUpd } = await supabase.from('orders').update({ status: 'Completed' }).eq('id', testOrder[0].id);
      if (ordUpd) console.log('Order update error:', ordUpd);
      else console.log('Order status updated to Completed');
      
      const { data: prodAfter } = await supabase.from('products').select('sales_count').eq('id', testOrder[0].product_id).single();
      console.log('Product sales_count AFTER:', prodAfter?.sales_count);
    }
  }
  
  // 6. Show final state
  console.log('\n=== FINAL VERIFICATION ===');
  const { data: finalOrders } = await supabase.from('orders').select('id, status, product_id').order('id', { ascending: false }).limit(3);
  console.log('Recent orders:', JSON.stringify(finalOrders, null, 2));
  const { data: finalProducts } = await supabase.from('products').select('id, name, sales_count').order('id', { ascending: false }).limit(5);
  console.log('Products:', JSON.stringify(finalProducts, null, 2));
}

main().catch(console.error);
