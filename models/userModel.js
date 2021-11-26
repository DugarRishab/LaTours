const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Every user must have a name'],
		trim: true,
		minLength: [4, 'Name must have atleat - 4 characters'],
		unique: [false, '']
	},
	email: {
		type: String,
		required: [true, 'Email is Required'],
		validate: [validator.isEmail, 'Invalid Email'],
		unique: [true, 'Email already in use'],
		lowercase: true
	},
	photo: {
		type: String,
		default: 'default.jpg'
	},
	role: {
		type: String,
		enum: ['user', 'guide', 'lead-guide', 'admin'],
		default: 'user'
	},
	password: {
		type: String,
		required: [true, 'Must have a password'],
		minLength: [8, 'Password must have atleast 8 characters'],
		select: false
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
		validate: {			// <- This works only on CREATE and SAVE
			validator: function (val) {
				return val === this.password;
			},
			message: "Password doesn't match"
		}
	},
	passwordChangedAt: Date,
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false
	}
});

userSchema.pre('save', async function (next) {

	if (!this.isModified('password')) return next();
														  //  NOTE ->>
	this.password = await bcrypt.hash(this.password, 12); // <- This will encrypt the password, the number means how strong the encryption should be. 
														  //    More the encrytion strength more the process will be CPU intensive. Default value is 10.
	this.passwordConfirm = undefined;
	next();
});
userSchema.pre('save', function (next) {
	if (!this.isModified('password') || this.isNew) return next();

	this.passwordChangedAt = Date.now() - 1000;
	next();
});
userSchema.pre(/^find/, async function (next) { // <- This is used before every FIND method for every user.
	this.find({ active: {$ne: false} });		// <- if a user has {active: false}, then it will not be shown on the find method.
	next();
});

/*  NOTE ->> 
	> we are defining underline functions in the userSchema because to create encyption tokens, 
		becaouse it uses user-based tokens, that is different for every user, and authController 
		doesn't direct have access to User Schema.
	> But we can stiil do it in authController, this way it's just better.
*/

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
	return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
	if (this.passwordChangedAt) {
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

		//console.log(changedTimestamp, JWTTimestamp);
		return JWTTimestamp < changedTimestamp;
	}

	return false; // false means NOT changed.
};
userSchema.methods.createPasswordResetToken = function () {

	const resetToken = crypto.randomBytes(32).toString('hex'); // <- Crypto is pre-installed encryption library

	this.passwordResetToken = crypto  // <- Crypto is not as strong as bcrypt, 
		.createHash('sha256')		  //    but in this case we don't need such strong encryption.
		.update(resetToken)
		.digest('hex');

	console.log({ resetToken }, this.passwordResetToken);
	
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

	return resetToken;
}

const User = mongoose.model('User', userSchema);
 
module.exports = User; 