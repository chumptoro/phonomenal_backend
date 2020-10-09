//mutation.js takes the mutation requests made from localhost:4444 written by us, query the db that has our real data of the site residing in the prisma demo server, and determines what gets returned 

//we are using primsa binding here to define createItem, updateItem!

const Mutations = {
	// createDog(parent, args, ctx, info) {
	// 	global.dogs = global.dogs || [];
	// 	// create a dog
	// 	const newDog = { name: args.name };
	// 	global.dogs.push(newDog);
	// 	return newDog;
	// },
	
	async createItem(parent, args, ctx, info) {
		//using Prisma CRUDS and add our own custom logic
		// db here refers to the Prisma db :

		//check if user is logged in
		const item = await ctx.db.mutation.createItem({
			data: {
				...args,	
			}
 		}, info);
 		return item;
	},

	updateItem(parent, args, ctx, info) {
		//first copy of the updates
		const updates = { ...args};
		//remove the ID from the update since IDs are non-changeable
		delete updates.id;
		//update
		return ctx.db.mutation.updateItem(
			{
				data: updates,
				where: {
					id: args.id,
				},
			},
			info //contains query sent in from the client side
		);
	},

	async createOrderItem(parent, {dish_id, quantity, special_instruction, price}, ctx, info) {
		//using Prisma CRUDS and add our own custom logic
		// db here refers to the Prisma db :

		//check if user is logged in
		const orderitem = await ctx.db.mutation.createOrderItem({
			data: {
				dish: {
					connect: { id: dish_id}
				},
				quantity,
				special_instruction,
				price,

			}
 		}, info);
 		return orderitem;
	}
};

module.exports = Mutations;
