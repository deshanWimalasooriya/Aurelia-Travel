/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('💰 Setting up Commission System...');

  // 1. Add Commission Rate to Hotels (if not exists)
  // This allows you to set custom rates (e.g., 5% vs 10%) per hotel later
  const hasRate = await knex.schema.hasColumn('hotels', 'commission_rate');
  if (!hasRate) {
    await knex.schema.table('hotels', (table) => {
      table.decimal('commission_rate', 5, 2).defaultTo(5.00); // Default 5%
    });
  }

  // 2. Create Commission Payments Table (The new table you requested)
  await knex.schema.createTable('commission_payments', (table) => {
    table.increments('id').primary();
    table.integer('hotel_id').unsigned().references('id').inTable('hotels').onDelete('CASCADE');
    table.integer('manager_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    
    table.decimal('amount_paid', 10, 2).notNullable();
    table.integer('bookings_count').notNullable(); // How many bookings this covers
    table.string('transaction_reference'); // Stripe/PayPal ID
    table.timestamp('paid_at').defaultTo(knex.fn.now());
    
    table.timestamps(true, true);
  });

  // 3. Update Bookings Table
  await knex.schema.table('bookings', (table) => {
    // Track if Aurelia has been paid for this specific booking
    table.enu('commission_status', ['pending', 'paid']).defaultTo('pending');
    
    // Link to the specific bulk payment record
    table.integer('commission_payment_id').unsigned().references('id').inTable('commission_payments').onDelete('SET NULL');
  });
};

exports.down = async function(knex) {
  // 1. Revert Bookings Table changes
  await knex.schema.table('bookings', (table) => {
    // FIX: Drop the Foreign Key constraint FIRST
    // This prevents the "Cannot drop column... needed in foreign key" error
    table.dropForeign('commission_payment_id');
    
    // THEN drop the columns
    table.dropColumn('commission_payment_id');
    table.dropColumn('commission_status');
  });

  // 2. Drop the Commission Payments Table
  await knex.schema.dropTableIfExists('commission_payments');

  // 3. Revert Hotels Table changes
  await knex.schema.table('hotels', (table) => {
    table.dropColumn('commission_rate');
  });
};