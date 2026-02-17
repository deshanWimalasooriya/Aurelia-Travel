/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('⚙️  Setting up Super Admin Tables...');

  // 1. Create 'platform_settings' (Check if exists first)
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

  // 2. Update 'commission_payments' safely
  const hasCommission = await knex.schema.hasTable('commission_payments');
  if (hasCommission) {
    // Check which columns already exist
    const hasPaymentMethod = await knex.schema.hasColumn('commission_payments', 'payment_method');
    const hasStatus = await knex.schema.hasColumn('commission_payments', 'status');
    const hasTxnRef = await knex.schema.hasColumn('commission_payments', 'transaction_reference');
    const hasTxnId = await knex.schema.hasColumn('commission_payments', 'transaction_id');

    await knex.schema.table('commission_payments', (table) => {
      // Add columns ONLY if they don't exist
      if (!hasPaymentMethod) {
          table.string('payment_method', 50).defaultTo('credit_card'); 
      }
      if (!hasStatus) {
          table.string('status', 20).defaultTo('completed');           
      }
      
      // Rename 'transaction_reference' to 'transaction_id' ONLY if old exists and new doesn't
      if (hasTxnRef && !hasTxnId) {
          table.renameColumn('transaction_reference', 'transaction_id');
      }
    });
    console.log('   -> Updated commission_payments table (Checked for duplicates)');
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
    const hasTxnId = await knex.schema.hasColumn('commission_payments', 'transaction_id');
    const hasStatus = await knex.schema.hasColumn('commission_payments', 'status');
    const hasPaymentMethod = await knex.schema.hasColumn('commission_payments', 'payment_method');

    await knex.schema.table('commission_payments', (table) => {
      if (hasTxnId) table.renameColumn('transaction_id', 'transaction_reference');
      if (hasStatus) table.dropColumn('status');
      if (hasPaymentMethod) table.dropColumn('payment_method');
    });
  }

  // 2. Drop 'platform_settings'
  await knex.schema.dropTableIfExists('platform_settings');
};