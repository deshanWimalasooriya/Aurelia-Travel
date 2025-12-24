const knex = require('../../config/knex')

//Get all users
exports.getAllUsers = async () => await knex('users').select('*');
exports.getUserById = (id) => knex('users').where({ id }).first();
exports.getUserByEmail = (email) => knex('users').where({ email }).first();
exports.createUser = async (user) => {
  const [newUser] = await knex('users')
    .insert(user)
    .returning(['id', 'username', 'email', 'role', 'created_at', 'updated_at']);
  return newUser;
};
exports.updateUser = (id, user) => knex('users').where({ id }).update(user);
exports.deleteUser = (id) => knex('users').where({ id }).del();

// Backend/models/userModel.js

exports.findById = async (id) => {
  return await knex('users')
    .select('*')
    .where({ id })
    .first();
};
