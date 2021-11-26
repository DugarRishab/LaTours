const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {

	const item = await Model.findByIdAndDelete(req.params.id);

	if (!item) {
		return next(new AppError(`No item with that id found`, 404));
	}

	res.status(200).json({
		status: "success"
	});
});
exports.updateOne = Model => catchAsync(async (req, res, next) => {

	// Query Function in mongoose ->
	const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true
	})

	if (!item) {
		return next(new AppError('No item with that id found', 404));
	}
	
	res.status(200).json({
		status: "success",
		data: {
			data: item
		}
	});
});
exports.createOne = Model => catchAsync(async (req, res, next) => {
	
	const newItem = await Model.create(req.body) // <- Query Function in mongoose

	res.status(201).json({
		status: 'success',
		data: {
			tour: newItem
		}
	});
});
exports.getOne = ( Model, populate ) => catchAsync( async (req, res, next) => {
	
	// Query Function in mongoose ->
	let query = Model.findById(req.params.id);
	if (populate) query = query.populate(populate);
	
	const item = await query;

	if (!item) {
		return next(new AppError('No item with that id found', 404));
	}
	//console.log(item.slug);
	res.status(200).json({
		status: 'success',
		data: {
			item
		}
	});
});
exports.getAll = Model => catchAsync(async (req, res, next) => {

	console.log(req.query);

	let filter = {};
	if (req.params.tourId) filter = { tour: req.params.tourId }; // <- To allow nested GET routes

	//EXECUTE THE QUERY ->>
	const features = new APIFeatures(Model.find(filter), req.query)
		.filter()
		.sort()
		.limitFields()
		.paginate();
		
	const item = await features
		.query
	//	.explain(); // <- Explain returns the stats of the results

	// SEND THE RESPONSE ->>
	res.status(200).json({
		status: 'success',
		results: item.length,
		data: {
			item
		}
	});
});