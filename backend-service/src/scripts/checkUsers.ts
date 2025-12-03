import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

async function checkUsers() {
  console.log('🔍 Checking Users in Database');
  console.log('==========================');
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Failed to fetch users:', error.message);
      process.exit(1);
    }
    
    console.log(`👥 Found ${users?.length || 0} users`);
    
    if (users && users.length > 0) {
      console.log('\n👤 User List:');
      users.forEach((user: any, index: number) => {
        console.log(`\n${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Package Type: ${user.package_type}`);
        console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      });
    } else {
      console.log('\n📭 No users found in the database');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }
}

checkUsers();