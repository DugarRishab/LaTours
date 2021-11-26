/* eslint-disable no-lone-blocks */
/* eslint-disable arrow-body-style */
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

// eslint-disable-next-line arrow-body-style
const signToken = id => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_TIMEOUT
	});
}
const createSendToken = (user, statuscode, res) => {
	const token = signToken(user._id);

	const cookieOptions = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN),
		httpOnly: true
	}
	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

	user.password = undefined; // <- So the password doesn't show up in 'create' method

	res.cookie('jwt', token, cookieOptions);

	res.status(statuscode).json({
		status: 'success',
		token,
		data: {
			user
		}
	});
}

exports.signup = catchAsync(async (req, res, next) => {

	//const newUser = await User.create(req.body);   // NOTE ->>
													 // > We should not directly create a user based on the request body, 
	const newUser = await User.create({				 //   becouse that way someone can easily login himself as a Admin.
		name: req.body.name,						 // > So we will just take relevant data out of request body and create a new user.
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
		passwordChangedAt: req.body.passwordChangedAt
		//role: req.body.role || 'user',
	});
	console.log('signing up...')
	//const url = `${req.protocol}://${req.get('host')}/me`;
	//await new Email(newUser, url).sendWelcome();

	createSendToken(newUser, 201, res);
});
exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;
	
	// 1) Check if email and password exists
	if (!email || !password) {
		return next(new AppError('Please provide email and password', 400));
	}

	// 2) Check if user exists and password is correct
	const user = await User.findOne({ email }).select('+password'); // <- to select a hidden property, use '+' as a prefix

	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Incorrect email or password', 401));
	}

	// 3) If everything is OK, send jwt back to client
	createSendToken(user, 200, res);
});
exports.protect = catchAsync(async (req, res, next) => {
	// 1) Getting token and checking if it's there ->
	let token;
	if (req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer'))
	{
		token=req.headers.authorization.split(' ')[1]
	}
	else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	}
	//console.log(token);

	if (!token) {
		return next(new AppError('You are not logedIn', 401));
	}

	// 2) Verification token ->
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
	//console.log(decoded.id);


	// 3) Check if user still exists ->
	const currentUser = await User.findById(decoded.id);
	//console.log(currentUser.name);
	if (!currentUser) {
		return next(new AppError('The user no longer exists', 401));
	}

	// 4) Check if user changed passward after jwt token was issued ->
	if (currentUser.changedPasswordAfter(decoded.iat)) {
		return next(new AppError('Recently changed Password! Please login Again', 401));
	}
	
	// 5) Grant access to the protected route ->>
	console.log('!!! Granting access !!!');

	res.locals.user = currentUser;
	req.user = currentUser;
	next();
});
exports.restrictTo = (...roles) => { 	// <- 'roles' is an array, roles takes all the values passed as params
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(new AppError('You do not have permission to perform this action', 403));
		}
		next();
	}
}
{// exports.restrictTo = (req, res, next, [roles]) => {
// 	if (!roles.includes(req.user.role)) {
// 		return next(new AppError('You do not have permission to perform this action', 403));
// 	}
	// }
}
exports.forgotPassword = catchAsync(async (req, res, next) => {

	// 1) Get user based on posted email ->
	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		return next(new AppError('There is no user with this email address'));
	}

	// 2) Generate the random reset token ->
	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false }); // <- We can't validate becouse, the user dowsn't remeber his password.

	// 3) Send it to the user's email ->
	try {
		const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

		await new Email(user, resetURL).sendPasswordReset();

		res.status(200).json({
			status: 'success',
			message: 'Token sent to email!'
		});

	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });

		return next(new AppError('There was a error sending the email. Try again Later!', 500));
	}

});
exports.resetPassword = catchAsync(async (req, res, next) => {
	// 1) Get user based on the token
	const hashedToken = crypto
		.createHash('sha256')
		.update(req.params.token)
		.digest('hex');
	
	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() }
	});

	// 2) If token has not expired, and there is a user, reset password
	if (!user) {
		return next(new AppError('Toekn is invalid or has expired', 400));
	}
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;

	await user.save();

	// 3) Update changePasswordAt property for the user


	// 4) Log the user in, send JWT
	createSendToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {

	const { password, newPassword, confirmNewPassword } = req.body;
	if (!password || !newPassword || !confirmNewPassword) {
		return next(new AppError('Please Enter the current Password, newPassword and confirmNewPassword', 401));
	}

	// !) Get User 
	const user = await User.findById(req.user.id).select('+password');

	// 2) Check if the password is correct
	if (!(await user.correctPassword(password, user.password))) {
		return next(new AppError('Incorrect password'));
	}
	// 3) If so, update user

	user.password = newPassword;
	user.passwordConfirm = confirmNewPassword;
	await user.save();

	// 4) Log user in, send JWT
	const token = signToken(user._id);

	res.status(200).json({
		status: 'success',
		token
	});
});

//Only for rendered pages ->
exports.isLoggedIn = async (req, res, next) => {	// <- We do not want to cause a Global error, so no catchAsync
	
	// 1) Getting token and checking if it's there ->
	if (req.cookies.jwt) {
		try {
			
			const token = req.cookies.jwt;
			const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
		
			const currentUser = await User.findById(decoded.id);
			//console.log(currentUser.name);
			if (!currentUser) {
				return next();
			}

			if (currentUser.changedPasswordAfter(decoded.iat)) {
				return next();
			}
		
			// There is as logged in user
			res.locals.user = currentUser;
			return next();
		}
		catch (err) {
			console.log(err)
			return next();
		}
	}
	next();
};
exports.logout = (req, res, next) => {

	const cookieOptions = {
		expires: new Date(Date.now() + 2*1000),
		httpOnly: true
	}
	
	// Sending new cookie with rubbish text to replace the new cookie ->
	res.cookie('jwt', 'loggedout', cookieOptions);
	
	res.status(200).json({
		status: 'Success'
	});
}