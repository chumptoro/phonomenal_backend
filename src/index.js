//execute function created in createServer.js to create the graphql yoga server

// require() is a builtin nodejs function to import things to this file
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const server = createServer();

// Use expresss middleware to handle cookies (JWT) and populate current user
server.express.use(cookieParser());

// decode the JWT so we can get the user Id on each request
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // put the userId onto the req for future requests to access
    req.userId = userId;
  }
  next();
});

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
