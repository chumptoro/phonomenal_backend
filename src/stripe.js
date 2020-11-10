//make sure
module.exports = require('stripe')(process.env.STRIPE_SECRET);
