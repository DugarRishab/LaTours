const express = require('express');
const viewsController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');

const Router = express.Router();

Router.get('/login', authController.isLoggedIn, viewsController.getLoginPage);
Router.get('/signup', viewsController.getSignupPage);
Router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
Router.get('/me', authController.protect, viewsController.getAccount);
Router.get('/', authController.isLoggedIn, viewsController.getOverview);

Router.post('/submit-user-data', authController.protect, viewsController.updateUserData);

module.exports = Router;