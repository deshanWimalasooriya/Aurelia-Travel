/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('⚙️  Adding contact fields to platform_settings...');
  
  const hasTable = await knex.schema.hasTable('platform_settings');
  if (hasTable) {
    // Check if column exists just to be safe
    const hasOfficeAddress = await knex.schema.hasColumn('platform_settings', 'office_address');
    
    if (!hasOfficeAddress) {
      return knex.schema.table('platform_settings', (table) => {
        table.string('office_address', 255).defaultTo('Colombo, Sri Lanka');
        table.string('contact_phone', 20).defaultTo('+94 11 234 5678');
        table.string('facebook_url', 255).defaultTo('');
        table.string('twitter_url', 255).defaultTo('');
        table.string('instagram_url', 255).defaultTo('');
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('platform_settings');
  if (hasTable) {
    return knex.schema.table('platform_settings', (table) => {
      table.dropColumn('office_address');
      table.dropColumn('contact_phone');
      table.dropColumn('facebook_url');
      table.dropColumn('twitter_url');
      table.dropColumn('instagram_url');
    });
  }
};