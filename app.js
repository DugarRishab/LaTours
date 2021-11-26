const path = require('path');
const express = require('express');
//const fs = require('fs');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const errorController=require('./controllers/errorController')
const tourRouter = require('./Routes/tourRoutes');// <- Importing Routers
const userRouter = require('./Routes/userRoutes');// <- Importing Routers
const reviewRouter = require('./Routes/reviewRoutes');
const viewRouter = require('./Routes/viewRoutes');

const app = express();

app.use(helmet()) // <- Set security HTTP Headers

console.log(`ENV = ${process.env.NODE_ENV}`);
if (process.env.NODE_ENV === 'development') {
	//console.log('MORGAN working');
	app.use(morgan('dev')); // <- 3rd party Middleware Function
}

const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: '!!! Too many requests from this IP, Please try again in 1 hour !!!'
});

app.use('/api', limiter); // <- Limit requests (Middleware)

app.use(express.json({ limit: '10kb' })); // <- Body Parser Midleware Functions 	// <- 'Limit' limits the amount of data comming in. 
app.use(cookieParser()); // <- cookie parser Middleware Function
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(mongoSanitize()); // <- Data Sanitization aganist NoSQL query Injection.
app.use(xss());   		  // <- Data Sanitization against xss

app.use(hpp({			  // <- Prevent Parameter Polution
	whitelist: [		  // <- whitelisted properties will not create error if defined more than once 
		'duration',
		'ratingsQuantity',
		'ratingsAverage',
		'maxGroupSize',
		'price',
		'difficulty'
	] 
}));
app.set('view engine', 'pug');
app.set('views', path.join( __dirname, 'views'));		  

app.use(express.static(path.join(__dirname, 'public'))); 		// <- vvvvvvvvvv
//app.use(express.static(`${__dirname}/public/img`));		// MiddleWare to serve static files.


app.use((req, res, next) => { // <- Just a example of Custom Midleware Function
	req.requestTime = new Date().toISOString();
	//console.log('!! Hello from the Middleware !!');
	//console.log(x);
	//console.log(req.headers, req.requestTime);
	console.log(req.requestTime);
	console.log('cookie start -> ');
	console.log(req.cookies);
	console.log('<- cookie over');
	next();
});

app.use('/api/v1/tours', tourRouter);// <- MiddleWare Routers
app.use('/api/v1/users', userRouter);// <- MiddleWare Routers
app.use('/api/v1/reviews', reviewRouter);
app.use('/', viewRouter);

app.all('*', (req, res, next) => {     // <- Middleware to handle Non-existing Routes
	next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

app.use(errorController); // <- Error Handling Middleware

module.exports = app;

