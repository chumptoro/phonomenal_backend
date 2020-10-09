const { GraphQLServer } = require('graphql-yoga');
const Mutation = require('./resolvers/Mutation');
const Query = require('./resolvers/Query');
const db = require('./db');

// This file create the GraphQL Yoga Server
// recall that the prisma demo server allows us to query and mutate data and get the result back, but none if it is done in JS.  We'd like to do that so we can use the full power of JS to custom our logic of queries and to implement how our database is to work when the frontend asks or sends data to it

function createServer() {
  //the queries will be resolved by resolvers, which are JS functions resided in Query.js and Mutation.js that get us results of query and mutation back.
  //typeDefs: fech the schema
  return new GraphQLServer({
    typeDefs: 'src/schema.graphql',
    resolvers: {
      Mutation,
      Query,
    },
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    context: req => ({ ...req, db }), //will be sent to resolver functions in Query.js and Mutation.js  so they can access the prisma database (known here as db) that contains our real data for the siteand its schema.  context can also pass in any other requests ('req') the query has, like the HTTP request header
  });
}

module.exports = createServer;