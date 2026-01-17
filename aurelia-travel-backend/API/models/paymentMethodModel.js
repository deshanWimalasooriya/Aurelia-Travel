const knex = require('../../config/knex');

exports.create = async (data) => {
    const [id] = await knex('payment_methods').insert(data);
    return knex('payment_methods').where({ id }).first();
};

exports.findAllByUserId = (userId) => {
    return knex('payment_methods')
        .where({ user_id: userId, is_active: true })
        .select('id', 'provider', 'card_last_four', 'card_brand', 'is_default');
};

exports.findById = (id) => knex('payment_methods').where({ id }).first();

exports.remove = (id, userId) => {
    return knex('payment_methods')
        .where({ id, user_id: userId })
        .update({ is_active: false });
};