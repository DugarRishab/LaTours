/* eslint-disable node/no-unsupported-features/es-syntax */
class APIFeatures{
	constructor(query, queryString) {
		this.query = query;
		this.queryString = queryString;
		console.log('constructor is working...')
	}

	// BUILD THE QUERY ->>
	filter() {

		// 1) Filtering ->
		const queryObj = { ...this.queryString};// <- First destructure and then forward the data to a new obj
		const excludeFields = ['page', 'sort', 'fields', 'limit'];
		excludeFields.forEach(el => delete queryObj[el]);
		/*
			we cant directly use < const queryObj = req.query >, becouse that would connect queryObj to req.query,
			and if we delete anything from this, we will also delete that from the original query obj.
		*/

		// 2) Adv. Filtering ->
		let queryStr = JSON.stringify(queryObj);
		queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
		console.log(JSON.parse(queryStr));
		/* 
			We could have directly inseted '$' directly into postman, but it is not common to do so,
			and ultimately our jon is to make better user experience.
		*/
		this.query = this.query.find(JSON.parse(queryStr));

		//console.log('filtering');

		return this;
	}

	sort() {
		if (this.queryString.sort) {
			const sortBy = this.queryString.sort.split(',').join(' ');// <- for multiple sorting
			this.query = this.query.sort(sortBy);
		}
		else {
			this.query = this.query.sort('-ratingsAverage');
		}
		//console.log('sorting');
		return this;
	}

	limitFields() {
		if (this.queryString.fields) {
			const fields = this.queryString.fields.split(',').join(' ');
			this.query = this.query.select(fields);
		} else {
			this.query = this.query.select('-__v');
		}
		//console.log('limiting Fields');
		return this;
	}

	paginate() {
		const page = this.queryString.page * 1;
		const limit = this.queryString.limit * 1;
		const skip = (page - 1) * (limit);

		this.query = this.query.skip(skip).limit(limit);
		//console.log('pagination');
		return this;
	}
}

module.exports = APIFeatures;