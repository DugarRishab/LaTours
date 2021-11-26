const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
	review: {
		type: String,
		required: [true, 'Rating can not be empty']
	},
	rating: {
		type: Number,
		required: [true, 'You must rate this tour first'],
		min: [0, 'Rating must be in the range of 0 to 5'],
		max: [5, 'Rating must be in the range of 0 to 5']
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	tour: {
		type: mongoose.Schema.ObjectId,
		ref: 'Tour',
		required: [true, 'A review must be of a tour']
	},
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required:[true,'A review must have a user']
	}
},
{
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
});
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {	
	
	this.populate({	// <- this will fill the reviews with user documents
		path: 'user',
		select: 'name photo'
	});
	// }).populate({	// <- this will fill the reviews with tour documents
	// 	path: 'tour',
	// 	select: 'name'
	// });

	next();
});
reviewSchema.statics.calcAverageRatings = async function (tourId) {
	const stats = await this.aggregate([
		{
			$match: { tour: tourId }
		},
		{
			$group: {
				_id: '$tour',
				nRating: { $sum: 1 },
				avgRating: { $avg: '$rating' }
			}
		}
	]);
	console.log(stats);

	if (stats.length > 0) {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsQuantity: stats[0].nRating,
			ratingsAverage: stats[0].avgRating
		});
	} else {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsQuantity: 0,
			ratingsAverage: 4.5
		});
	}
}
reviewSchema.post('save', function () {

	this.constructor.calcAverageRatings(this.tour);
});												  			// NOTE ->>
reviewSchema.pre(/^findOneAnd/, async function (next) { 	// we can not use post here bocouse, the we will no longer have access to the query document. 
	// this.constructor.calcAverageRatings(this.tour); 		// But if we use 'pre', then we will get acess to the old document and not the new document.
	this.r = await this.findOne();							// So to solve this problem we define the below mentioned method
	next();
});
reviewSchema.post(/^findOneAnd/, async function (next) { 	
	await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
 
module.exports = Review; 