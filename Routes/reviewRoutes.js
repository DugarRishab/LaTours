const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const Router = express.Router({ mergeParams: true }); // <- 'mregeParams', lets params be passed around from one router to another.
Router.use(authController.protect);

Router
	.route('/')
	.get(reviewController.getAllReviews)
	.post(
		authController.restrictTo('user'),
		reviewController.setTourUserIds,
		reviewController.newReview);

Router
	.route('/:id')
	.get(reviewController.getReview)
	.patch(authController.restrictTo('user', 'admin'), reviewController.updatereview)
	.delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = Router;