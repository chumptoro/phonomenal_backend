//execute function created in createServer.js to create the graphql yoga server

// require() is a builtin nodejs function to import things to this file
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

//TODO: Use expresss middleware to handle cookies (JWT) and populate current user

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`);
  }
);
