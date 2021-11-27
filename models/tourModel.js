const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');
//const User = require('./userModel');

//building Schema of the API ->
const tourSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "A Tour must have a name"],  // <- Pre-defined validator
		unique: [true, 'A tour name must be unique'], // <- Not a validator
		trim: true,
		maxLength: [40, 'A tour name cannot be more than 40 characters'],
		minLength: [10, 'A tour name cannot be less than 10 characters']
		//validate: validator.isAlphanumeric([en-US, ])  
	},
	duration: {
		type: Number,
		required: [true, "A Tour must have a duration"],
	},
	maxGroupSize: {
		type: String,
		required: [true, "A Tour must have a maximum Group Size"],
	},
	ratingsAverage: {
		type: Number,
		default: 4.5,
		min: [0, "Rating must range between 0 and 5"],
		max:[5,"Rating must range between 0 and 5"],
		set: val => Math.round(val * 10) / 10
	},
	ratingsQuantity: {
		type: Number,
		default: 0
	},
	price: {
		type: Number,
		required: [true, "A Tour must have a price"]
	},
	priceDiscount: {
		type: Number,
		validate: {
			validator: function(val) {
				return val < this.price;  										// NOTE ->
			},																	// 'this' only points towards newly created documnent, 
			message: "The discount ({value}) must be less than Regular Price"	// so this validator will not work while updating documents
		}
	},
	summary: {
		type: String,
		trim: true, // <- removes extra space
		required: [true, "A Tour must have a summary"]
	},
	difficulty: {
		type: String,										  // NOTE ->
		required: [true, "A Tour must have a difficulty"],    //  This is just a Short-hand for the below-mentioned way
		enum: {                                               // This is the correct way of defining validators
			values: ['easy', 'medium', 'difficult'],		  // For this we will use a node library called -> 'Validator'
			message: "Difficulty must be either easy or medium or difficult"
		}
	},
	description: {
		type: String,
		trim: true
	},
	imageCover: {
		type: String,
		required: [true, "A Tour must have a cover image"]
	},
	images: [String],
	createdAt: {
		type: Date,
		default: Date.now(),
		select: false
	},
	startDates: [Date],
	secretTour: {
		type: Boolean,
		default:false
	},
	startLocation: {	// <- GEOJSON Format
		type: {
			type: String,
			default: 'Point',
			enum: ['Point']
		},
		coordinates: [Number],
		address: String,
		description: String
	},
	locations: [
		{
			type:{
				type: String,
				default: 'Point',
				enum: ['Point']
			},
			coordinates: [Number],
			address: String,
			description: String,
			day: Number
		}
	],
	guides: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'User'
		}
	],
	slug: String
}, {
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
	return this.duration / 7;
});

tourSchema.virtual('reviews', {	// <- This is virtual populate
	ref: 'Review',
	foreignField: 'tour',
	localField: '_id'
});

// DOCUMENT (Moongoose) MIDDLEWARE: Works only before .save() and .create() ->

tourSchema.pre('save', function (next) {
	this.slug = slugify(this.name, { lower: true });// <- 'this' method is not avialable for arrow func.
	console.log(this.slug);
	next();
});

// tourSchema.pre('save', async function (next) {		// <- Used to embbed guides in our tour data.
// 	const guidesPromises = this.guides.map(async id => await User.findById(id));
// 	this.guides = await Promise.all(guidesPromises);
// 	next();
// });

/*  NOTE ->>
	If we want to operate on virtuals, we need to do where the virtual is
	defined. Since it is not a real property, it will not show up with 
	our data, and out handlers will not be able to operate on them.
*/

// QUERY MIDDLEWARE ->>>

// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) { // <- All queries that start with find, like findOne, etc
	this.find({
		secretTour: {
			$ne: true
		}
	});
	this.start = Date.now();
	next();
});
tourSchema.pre(/^find/, function (next) {
	
	this.populate({	// <- Populate will fill the guides with user documents
		path: 'guides',
		select: '-__v -passwordChangedAt'
	});
	next();
});
tourSchema.post(/^find/, function(docs, next){
	console.log(`Query took ${Date.now() - this.start} milliseconds !`);
	next();
});

// AGGREGATION MIDDLEWARE ->	// Every data before going to the client, goes through aggregation middleware then aggregation queries

// tourSchema.pre('aggregate', function (next) {

// 	this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });		// <- Hides all secret tours
// 	//console.log(this);
// 	next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;