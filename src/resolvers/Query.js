
//query.js uses prisma binding.  query.js takes the query requestss made from localhost:4444 written by us, query the db that has our real data of the site residing in the prisma demo server, and determines what gets returned 

//parent:
//args: the node/data model (like an instance of 'User') is being queried
//context: contains the prisma database provided by graphQL server (createServer.js) after it pulls this from prisma
//context can also pass in any other requests ('req') the query has, like the HTTP request header

const { forwardTo } = require('prisma-binding');

const Query = {
	// dogs: function(parent, args, ctx, info) {
	// 	global.dogs = global.dogs || [];
	// 	return global.dogs;
	// },

	async items(parent, args, ctx, info) {
		const items = await ctx.db.query.items();
		return items;
	},
	item: forwardTo('db'),
};

//we can use this when we want common tasks done like getting all items from the database:
// const { forwardTo } = require('prisma-binding');
// 
// const Query = {
// 	items: forwardto('db'),
// };



module.exports = Query;
