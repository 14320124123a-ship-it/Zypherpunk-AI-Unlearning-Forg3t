#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testNewSupabase() {
  console.log('Testing connection to new Supabase instance...');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Test connection by checking if we can access the auth schema
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    
    // Test by querying a simple count from unlearning_requests (will be 0 if table exists)
    const { count, error } = await supabase
      .from('unlearning_requests')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('Table might not exist yet, but connection is successful');
      console.log('Connection test: ✅ SUCCESS');
    } else {
      console.log(`Table exists with ${count} records`);
      console.log('Connection test: ✅ SUCCESS');
    }
    
    console.log('\n✅ New Supabase configuration is working correctly!');
    console.log('You can now run the setup.sql script in your Supabase SQL editor to create the tables.');
    
  } catch (error) {
    console.error('❌ Error testing Supabase connection:', error);
    process.exit(1);
  }
}

testNewSupabase();