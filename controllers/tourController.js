const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.aliasTopTours = ( req, res, next ) => { // <- Aliasing Middleware
	req.query.limit = '5';
	req.query.sort = '-ratingsAverage,price';
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
	next();
}

const multerStorage = multer.memoryStorage(); // <- save it to memory

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('Not a image! Please upload only images.', 400), false);
	}
}

const upload = multer({			// <- 3rd party middleware to handle image uploads
	storage: multerStorage,
	fileFilter: multerFilter
});	

exports.uploadTourImages = upload.fields([
	{ name: 'imageCover', maxCount: 1 },
	{ name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {

	if (!req.files.imageCover || !req.files.images) return next(); 							// <- 'files' plural beacouse we used '.fields' function which creates an array

 	req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpg`;

	// 1) imageCover ->
	await sharp(req.files.imageCover[0].buffer)
		.resize(2000, 1333)									// <- crop image
		.toFormat('jpeg')									// <- Convert to jpeg
		.jpeg({ quality: 90 })								// <- decrease quality to save space
		.toFile(`public/img/tours/${req.body.imageCover}`);	// <- save image to disk
	
	// 2) images
	req.body.images = [];

	await Promise.all(
		req.files.images.map(async (file, i) => {
			const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpg`;
			
			await sharp(file.buffer)
				.resize(2000, 1333)									// <- crop image
				.toFormat('jpeg')									// <- Convert to jpeg
				.jpeg({ quality: 90 })								// <- decrease quality to save space
				.toFile(`public/img/tours/${filename}`);	// <- save image to disk
		
			req.body.images.push(filename);
		})
	);
	
	next();
});

//Route Handlers ->>>
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews '})	// NOTE ->>
exports.newTour = factory.createOne(Tour);					// exports.getTour = factory.getOne(Tour,   'reviews' )
exports.updateTour = factory.updateOne(Tour);				// this also works  if you're only specifying the path :)
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
	const stats = await Tour.aggregate([
		{
			$match: { ratingsAverage: { $gte: 0 } } // <- Only documents that matches the consition will be shown
		},
		{
			$group: {
				_id: '$difficulty',  // <- grouping based on difficulty
				numTours: { $sum: 1 },
				numRatings: { $sum: '$ratingsQuantity' },
				avgRating: { $avg: '$ratingsAverage' },
				avgPrice: { $avg: '$price' },
				minPrice: { $min: '$price' },
				maxPrice: { $max: '$price' }
			}
		},
		{
			$sort: { avgprice: 1 }
		}
		// {
		// 	$match: {
		// 		_id: { $ne: 'easy' }
		// 	}
		// }
	]);
	/*  NOTE ->>
		We can directly put aggregation middleware here but that is not a good idea,
		becouse then the code will be repetative.
	*/
	res.status(200).json({
		status: "success",
		data: {
			stats
		}
	});
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
	const year = req.params.year * 1;
	//console.log(year);
	const plan = await Tour.aggregate([
		{
			$unwind: '$startDates'
		},
		{
			$match: {
				startDates: {
					$gte: new Date(`${year}-01-01`),
					$lte: new Date(`${year}-12-31`)
				}
			}
		},
		{
			$group: {
				_id: { $month: '$startDates' }, // <- Grouping is always based on _id
				numTour: { $sum: 1 },// <- Counting no. of Tours
				tours: { $push: '$name' }
			}
		},
		{
			$addFields: { month: '$_id' }
		},
		{
			$project: {
				_id: 0  // <-so that _id doesn't show
			}
		},
		{
			$sort: { numTour: -1 }
				
		},
		{
			$limit: 12 // <- Not Important, just for reference
		}
	]);
	//console.log(plan);
	res.status(200).json({
		status: "success",
		data: {
			plan,
			msg: "hi!"
		}
	});
	
	
});
exports.getToursWithin = catchAsync(async (req, res, next) => {
	const { distance, latlng, unit } = req.params;
	const [ lat, lng ] = latlng.split(',');

	const radius = (unit === 'mi') ? distance / 3963.2 : distance / 6378.1;

	if (!lat || !lng) {
		next(new AppError('Please provide latitude and longitude in the format- lat,lng', 400));
	}

	const tours = await Tour.find({
		startLocation: {
			$geoWithin: {				// <- GEOspatial query
				$centerSphere: [[lng, lat], radius] // <- we could also use the near function
			}
		}
	});

	res.status(200).json({
		status: 'success',
		results: tours.length,
		data: {
			tours
		}
	});

});
exports.getDistances = catchAsync(async (req, res, next) => {
	const { latlng, unit } = req.params;
	const [lat, lng] = latlng.split(',');
	
	console.log(unit);

	// if (!unit === "mi" && !unit === "km") {
	// 	next(new AppError('Please provide only - "mi" or "km" as unit', 400));
	// }

	const multiplier = (unit === "mi") ? 0.000621371 : 0.001;

	if (!lat || !lng) {
		next(new AppError('Please provide latitude and longitude in the format- lat,lng', 400));
	}

	const distances = await Tour.aggregate([
		{
			$geoNear: {
				near: {
					type: 'Point',
					coordinates: [lng * 1, lat * 1]
				},
				distanceField: 'distance',	// <- Creates a new field called distance for each tour ( distances is in meters )
				distanceMultiplier: multiplier	// <- To get the results  in km
			}
		},
		{
			$project: {		// <- This shows onl;y the fields we want
				distance: 1,
				name: 1,
				price: 1
			}
		}
	]);

	res.status(200).json({
		status: 'success',
		data: {
			distances
		}
	});
});
