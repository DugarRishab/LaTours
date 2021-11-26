const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Catching unCaught Exceptions ->
process.on('unCaughtException', err => {
	console.log(`UNCAUGHT EXCEPTION -> ${err.name} - ${err.message}`);
	console.log('App SHUTTING DOWN...');
	process.exit(1);   // <- Then will shut down the server.
});

dotenv.config({ path: './config.env' });
const app = require('./app');
const errorController = require('./controllers/errorController');

const DB = process.env.DATABASE
	.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
//console.log(DB);

mongoose.connect(DB, {// <- Mongoose Connection
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false,
	useUnifiedTopology: true 
}).then(() => {
	console.log('DB connection established');
});

// Starting Server ->
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
	console.log(`App running at port ${port}...`);
});

// Catching unHandleled Rejections ->
process.on('unhandledRejection', err => {
	console.log(`UNHANDELLED REJECTION -> ${err.name} - ${err.message}`);
	console.log(err);
	console.log('App SHUTTING DOWN...');
	server.close(() => {   // <- This will first terminate all requests
		process.exit(1);   // <- Then will shut down the server.
	});
});

