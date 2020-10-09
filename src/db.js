//this file uses Prisma bindings (https://github.com/prisma-labs/prisma-binding) to connects to the remote prisma DB and allows us to query it using JS.  recall that we are not able to do with using the regumar prisma 1 API (https://v1.prisma.io/docs/1.0/reference/prisma-api/mutations-ol0yuoz6go)

//see the rsolvers files mutation.js and query.js to see  primsa binding used to define createItem, updateItem!

const { Prisma } = require('prisma-binding');

const db = new Prisma({
  typeDefs: 'src/generated/prisma.graphql',
  endpoint: process.env.PRISMA_ENDPOINT,
  secret: process.env.PRISMA_SECRET,
  debug: false,
});

module.exports = db;

//// now we can write query and mutations in JS:
// // Retrieve `name` of a specific user
// prisma.query.user({ where: { id: 'abc' } }, '{ name }')
// 
// // Retrieve `id` and `name` of all users
// prisma.query.users(null, '{ id name }')
// 
// // Create new user called `Sarah` and retrieve the `id`
// prisma.mutation.createUser({ data: { name: 'Sarah' } }, '{ id }')
// 
// // Update name of a specific user and retrieve the `id`
// prisma.mutation.updateUser({ where: { id: 'abc' }, data: { name: 'Sarah' } }, '{ id }')
// 
// // Delete a specific user and retrieve the `id`
// prisma.mutation.deleteUser({ where: { id: 'abc' } }, '{ id }')