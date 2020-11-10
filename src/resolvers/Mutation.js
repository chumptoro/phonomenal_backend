//mutation.js takes the mutation requests made from localhost:4444 written by us, query the db that has our real data of the site residing in the prisma demo server, and determines what gets returned 

//we are using primsa binding here to define createItem, updateItem!

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
//nodejs generate random token
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');
const stripe = require('../stripe');

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
		// db here refers to the Prisma db

		//check if user is logged in
		const { userId } = ctx.request;
		if (!userId) {
      throw new Error('You must be signed in!');
    }

		const orderitem = await ctx.db.mutation.createOrderItem({
			data: {
				quantity,
				special_instruction,
				price,
				patron: {
					connect: { id: userId },
				},
				dish_id,
				dish: {
					connect: { id: dish_id}
				},
				dish_name,

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

	async removeOrderItem(parent, args, ctx, info) {
		const orderitem = await ctx.db.mutation.deleteOrderItem(
			{
				where: { id: args.id }
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
		ctx.response.clearCookie('token');
		return {message: "Goodbye"};
	},
	async requestPasswordReset(parent, args, ctx, info) {
    // 1. Check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }
    // 2. Set a reset token and expiry on that user
    const randomBytesPromiseified = promisify(randomBytes);
    const resetToken = (await randomBytesPromiseified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry },
    });
    //3. Email them that reset token
    const mailRes = await transport.sendMail({
      from: 'mark.pham.developer@gmail.com',
      to: user.email,
      subject: 'Your Password Reset Token',
      html: makeANiceEmail(`Your Password Reset Token is here!
      \n\n
      <a href="${process.env
        .FRONTEND_URL}/password_reset?resetToken=${resetToken}">Click Here to Reset</a>`),
    });

		// 4. Return the message
		console.group(res);
		return { message: 'Thanks!' };
				
		//SAMPLE GraphQL mutation  
		// mutation requestPasswordReset {
		// 	requestPasswordReset(email: "mark.p.pham@gmail.com") {
		// 		message
		// 	}
		// }
	},
	async resetPassword(parent, args, ctx, info) {
    // 1. check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error("Please make sure your passwords match!");
    }
    // 2. check if its a legit reset token
    // 3. Check if its expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if (!user) {
      throw new Error('This token is either invalid or expired!');
    }
    // 4. Hash their new password
    const password = await bcrypt.hash(args.password, 10);
    // 5. Save the new password to the user and remove old resetToken fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    // 6. Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. Set the JWT cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365*2,
    });
    // 8. return the new user
		return updatedUser;

		//sample GraphQL mutation
		// mutation reset {
		// 	resetPassword(resetToken: "eb26476183e1060bf274be15c76fc8861bcc3b26", password:"r" confirmPassword:"r") {
		// 		id
		// 		first_name
		// 	}
		// }

	},
	
	async createOrder(parent, args, ctx, info) {
		// 1. Query the current user and make sure they are signed in
		const { userId } = ctx.request;
		if (!userId) throw new Error('You must be signed in to complete this order');
		const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
      id
      first_name
      email
      shopping_bag {
        id
        quantity
        dish { name price id description image largeImage }
      }}`
		);
		// 2. recalculate the total for the price
		const amount = user.shopping_bag.reduce(
			(tally,orderItem) => tally + orderItem.dish.price * orderItem.quantity*100,
			0
		);
		//console.log("THE AMOUNT IS " + amount);
		// 3. Create the stripe charge (turn token into $$$)
		const charge = await stripe.charges.create({
			amount,
			currency: 'USD',
			source: args.token,
		});
		// 4. Convert the OrderItems to CheckedOutOrderItems
		const checkedOutOrderItems = user.shopping_bag.map(orderItem => {
			const checkedOutOrderItem = {
				quantity: orderItem.quantity,
				special_instruction: orderItem.quantity,
				price: orderItem.dish.price,

				dish_name: orderItem.dish.name,
				description: orderItem.dish.description,
				image: orderItem.dish.image,
				largeImage: orderItem.dish.largeImage,

				patron: { connect: { id: userId } },
			};
			delete checkedOutOrderItem.id;
			console.log(checkedOutOrderItem);
			return checkedOutOrderItem;
		});
		// 5. create the Order
		const order = await ctx.db.mutation.createOrder({
			data: {
				total_price: charge.amount,
				charge: charge.id,
				checked_out_order_items: { create: checkedOutOrderItems },
				patron: { connect: { id: userId } },
			},
		});
		// 6. Clean up - clear the users cart, delete orderItems
		const orderItemIds = user.shopping_bag.map(orderItem => orderItem.id);
		await ctx.db.mutation.deleteManyOrderItems({
			where: {
				id_in: orderItemIds,
			},
		});
		// 7. Return the Order to the client
		return order;
	},
	
};

module.exports = Mutations;
