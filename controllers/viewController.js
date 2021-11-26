const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

const connectSrc = process.env.CSP_CONNECT_SRC;

exports.getOverview = catchAsync(async (req, res) => {

	// 1) Get tour data from Controller
	const tours = await Tour.find();
	// 2) Build template

	// 3) Render that template using tour data from 1)
	res
		.status(200)
		.set(
			'Content-Security-Policy',
			`connect-src ${connectSrc}`
		)
		.render('overview', {
			title: 'All Tours',
			tours
		});
});
exports.getTour = catchAsync(async (req, res, next) => {

	// !) Get Tour data according to slug ->
	
	const query = req.params.slug;
	const tour = await Tour.findOne({ slug: query }).populate("reviews");
	//console.log(tour);

	// 2) Error If no tour found ->
	if (!tour) {
		return next(new AppError('No Tour found with that name', 404));
	}

	// 3) Render Tour Page ->
	res
		.status(200)
		.set(
			'Content-Security-Policy',
			`connect-src ${connectSrc}`
		)
		.render('tour', {
			status: "success",
			tour,
			title: tour.name
		});
});
exports.getLoginPage = (req, res) => {

	res
		.status(200)
		.set(
			'Content-Security-Policy',
			`connect-src ${connectSrc}`
		)
		.render('login', {
			status: 'success',
			title: 'LOGIN'
		});
}
exports.getAccount = (req, res) => {
	
	console.log('Getting account... ');
	// const { user } = res.locals;
	// console.log(`user = ${user}`);
	
	res
		.status(200)
		.set(
			'Content-Security-Policy',
			`connect-src ${connectSrc}`
		)
		.render('account', {
			//user,
			title: 'Your Account'
		});
	
	//console.log(res);
}
exports.updateUserData = catchAsync(async (req, res, next) => {
	const updatedUser = await User.findByIdAndUpdate(req.user.id, {
		name: req.body.name,				// <- Fields to be updated
		email: req.body.email
	},
	{
		new: true,							// <- Options
		runValidators: true
	});
	
	res
		.status(200)
		.set(
			'Content-Security-Policy',
			`connect-src ${connectSrc}`
		)
		.render('account', {
			title: 'Your Account',
			user: updatedUser
		})
});
exports.getSignupPage = (req, res) => {

	res
		.status(200)
		.set(
			'Content-Security-Policy',
			`connect-src ${connectSrc}`
		)
		.render('signup', {
			status: 'success',
			title: 'SIGNUP'
		});
}