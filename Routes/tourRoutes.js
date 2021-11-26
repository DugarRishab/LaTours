const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

const Router = express.Router();

//Router.param('id', tourController.checkID);// <- param Middleware

Router
	.route('/top-5-cheap')  // <- Aliasing Router
	.get(tourController.aliasTopTours, tourController.getAllTours);

Router
	.route('/tour-stats')
	.get(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide', 'guide'),
		tourController.getTourStats
	);

Router
	.route('/monthly-plan/:year')
	.get(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide', 'guide'),
		tourController.getMonthlyPlan
	);
	
Router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

Router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

Router              // <- Mounting Routers
	.route('/')
	.get(tourController.getAllTours)
	.post(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.newTour
	);
// eslint-disable-next-line indent					 
													 // NOTE->>
//.get(catchAsync(tourController.getAllTours))   	 // <- We could directly call catchAsync directly here,
													 // <- but we then we will have to remember which of them are async
Router
	.route('/:id')
	.get(tourController.getTour)
	.patch(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.uploadTourImages,
		tourController.resizeTourImages,
		tourController.updateTour
	)
	.delete(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.deleteTour
	);

Router.use('/:tourId/reviews', reviewRouter) // <- Mounting Router on router
	
module.exports = Router; 