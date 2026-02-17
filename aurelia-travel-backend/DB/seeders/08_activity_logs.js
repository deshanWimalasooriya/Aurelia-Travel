/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('📜 Seeding Activity Logs...');

  // 1. Clear existing entries
  await knex('activity_logs').del();

  // 2. Get a valid Admin ID to associate logs with
  // We try to find a user with role 'admin' (seeded in 02_seed_users.js)
  let admin = await knex('users').where({ role: 'admin' }).first();
  
  // Fallback: If no admin exists, just pick the first user (for dev safety)
  if (!admin) {
    admin = await knex('users').first();
  }

  if (!admin) {
    console.log('⚠️ No users found. Skipping activity log seeding.');
    return;
  }

  // 3. Insert Mock Logs
  await knex('activity_logs').insert([
    {
      admin_id: admin.id,
      action_type: 'DELETE_USER',
      target: 'User: john_doe',
      module: 'Users',
      details: 'User deleted due to violation of terms.',
      status: 'success',
      created_at: knex.fn.now()
    },
    {
      admin_id: admin.id,
      action_type: 'UPDATE_COMMISSION',
      target: 'Global Rate: 12%',
      module: 'Finance',
      details: 'Changed commission rate from 10% to 12%.',
      status: 'warning',
      // Create a date 1 day ago
      created_at: new Date(Date.now() - 86400000)
    },
    {
      admin_id: admin.id,
      action_type: 'BAN_HOTEL',
      target: 'Hotel: Grand Plaza',
      module: 'Hotels',
      details: 'Hotel banned pending investigation.',
      status: 'error',
      created_at: new Date(Date.now() - 172800000) // 2 days ago
    },
    {
      admin_id: admin.id,
      action_type: 'AUTO_BACKUP',
      target: 'Database',
      module: 'System',
      details: 'Weekly automated backup completed.',
      status: 'info',
      created_at: new Date(Date.now() - 259200000) // 3 days ago
    },
    {
      admin_id: admin.id,
      action_type: 'RESOLVE_TICKET',
      target: 'Ticket #8821',
      module: 'Support',
      details: 'Refund processed for guest complaint.',
      status: 'success',
      created_at: new Date(Date.now() - 345600000) // 4 days ago
    }
  ]);

  console.log('✅ Activity Logs Seeded');
};