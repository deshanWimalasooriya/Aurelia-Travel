/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('⚙️  Setting up Super Admin Tables...');

  // 1. Create 'platform_settings' (This is completely new)
  const hasSettings = await knex.schema.hasTable('platform_settings');
  if (!hasSettings) {
    await knex.schema.createTable('platform_settings', (table) => {
      table.increments('id').primary();
      table.decimal('commission_rate', 5, 2).defaultTo(5.00).notNullable();
      table.string('support_email', 100).defaultTo('admin@aurelia.com');
      table.boolean('maintenance_mode').defaultTo(false);
      table.timestamps(true, true);
    });

    // Seed default settings
    await knex('platform_settings').insert([
      { id: 1, commission_rate: 5.00, support_email: 'admin@aurelia.com', maintenance_mode: false }
    ]);
    console.log('   -> Created platform_settings table');
  }

  // 2. Update 'commission_payments' 
  // (Table created in 06_commission_system.js, but needs updates for Super Admin Finance)
  const hasCommission = await knex.schema.hasTable('commission_payments');
  if (hasCommission) {
    await knex.schema.table('commission_payments', (table) => {
      // Add columns expected by Super Admin Finance Page
      table.string('payment_method', 50).defaultTo('credit_card'); // e.g. 'Credit Card', 'Bank Transfer'
      table.string('status', 20).defaultTo('completed');           // e.g. 'completed', 'failed'
      
      // Rename 'transaction_reference' to 'transaction_id' to match frontend/backend code
      // Note: If you have data, this preserves it.
      table.renameColumn('transaction_reference', 'transaction_id');
    });
    console.log('   -> Updated commission_payments table with new columns');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // 1. Revert 'commission_payments' changes
  const hasCommission = await knex.schema.hasTable('commission_payments');
  if (hasCommission) {
    await knex.schema.table('commission_payments', (table) => {
      table.renameColumn('transaction_id', 'transaction_reference');
      table.dropColumn('status');
      table.dropColumn('payment_method');
    });
  }

  // 2. Drop 'platform_settings'
  await knex.schema.dropTableIfExists('platform_settings');
};