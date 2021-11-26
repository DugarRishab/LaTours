// const APIFeatures = require('./../utils/apiFeatures');
// const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');
const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
	
	if (!req.body.tour) req.body.tour = req.params.tourId;
	if (!req.body.user) req.body.user = req.user.id;
	next();
}
exports.getAllReviews = factory.getAll(Review);
exports.newReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updatereview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);