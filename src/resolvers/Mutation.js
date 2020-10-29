//mutation.js takes the mutation requests made from localhost:4444 written by us, query the db that has our real data of the site residing in the prisma demo server, and determines what gets returned 

//we are using primsa binding here to define createItem, updateItem!

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 

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

	async addOrderItemFromMenu(parent, {dish_id, quantity, special_instruction, price, dish_name}, ctx, info) {
		//using Prisma CRUDS and add our own custom logic
		// db here refers to the Prisma db :

		//check if user is logged in
		const orderitem = await ctx.db.mutation.createOrderItem({
			data: {
				quantity,
				special_instruction,
				price,
				dish_id,
				dish: {
					connect: { id: dish_id}
				},
				dish_name
			}
 		}, info);
 		return orderitem;
	},

	async reviseOrderItem(parent, args, ctx, info) {
		//first copy of the updates
		const updates = { ...args};
		//remove the ID from the update since IDs are non-changeable
		delete updates.id;
		//update
		return ctx.db.mutation.updateOrderItem(
			{
				data: updates,
				where: {
					id: args.id,
				},
			},
			info //contains query sent in from the client side
		);
	},

	async removeOrderItem(parent, {id}, ctx, info) {
		const orderitem = await ctx.db.mutation.deleteOrderItem(
			{
				where: { id }
			},
				info
		);
 		return orderitem;
	},

	async deleteManyOrderItems(parent, {id}, ctx, info) {
		const orderitems = await ctx.db.mutation.deleteManyOrderItems(
			{
				id: id
			},
				info
		);
 		return orderitems;
	},

	async signup(parent, args, ctx, info) {
		//lower-case all email input to ensure no login problem when user use CAPLOCKS accidentally
		const email = args.email.toLowerCase();
		//make sure the email is not already used to register for an account. 
		const user_email_exist = await ctx.db.query.user({ where: { email } });
    if (user_email_exist) {
			throw new Error(`${email} is already registered`);
			/* throw new Error(`This email is already registered`); */
    }
		//hash password
		const password = await bcrypt.hash(args.password, 10);
		//create user
		const user = await ctx.db.mutation.createUser(
			{
				data: {
					...args,
					password,
					permissions: {set: ['USER']},	
				},
			}, 
			info
		);
		//create JWT for new user:
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
		// we set the jwt as a cookie on the response
		ctx.response.cookie('token', token, {
			httpOnly: true, 
			maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 year cookie
		});
		//return user to the browser
		return user;
	},

  async signin(parent, { email, password }, ctx, info) {
    // 1. check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
			throw new Error(`Oh no! Your email or password isn't correct.`);
			// throw new Error(`Ouch! Looks like your email or password isn't correct ${email}`);
    }
    // 2. Check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error(`Oh no! Your password isn't correct.`);
    }
    // 3. generate the JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 5. Return the user
    return user;
	},
	
	async signout(parent, { email, password }, ctx, info) {
		ctx.response.clearCookie('token');;
  },
};

module.exports = Mutations;
