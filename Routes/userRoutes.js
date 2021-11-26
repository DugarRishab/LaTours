const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
//const reviewController = require('./../controllers/reviewController');

const Router = express.Router();
											   // NOTE ->>
Router.post('/signup', authController.signup); // <- These roter doesnot follow the REST Architechture ,
Router.post('/login', authController.login);   //    becouse any route other than post can't have access to the particular route.
Router.get('/logout', authController.logout);
Router.post('/forgotPassword', authController.forgotPassword);
Router.patch('/resetPassword/:token', authController.resetPassword);

Router.use(authController.protect); // <- This middleware will run before all other routes comming after this

Router.patch('/updateMyPassword', authController.updatePassword);

Router.patch(
	'/updateMyData',
	userController.uploadUserPhoto,
	userController.resizeUserPhoto,
	userController.updateMe);

Router.delete('/deleteMe', userController.deleteMe);
Router.get('/me', userController.getMe, userController.getUser);

Router.use(authController.restrictTo('admin')); // <- This middleware will run before all other routes comming after this

//Mounting Routes ->
Router									// NOTE ->>
	.route('/')							// <- These Routes follow the REST architechture.
	.get(userController.getAllUsers)	// <- Becouse a particular route can be accessed by one or many http methods.
	.post(userController.newUser);		//	  const userController = require('./../controllers/userController');

Router
	.route('/:id')
	.get(userController.getUser)
	.patch(userController.updateUser)
	.delete(userController.deleteUser);


module.exports = Router;