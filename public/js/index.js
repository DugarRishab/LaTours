/* eslint-disable*/

import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login } from './login';
import { logout } from './login';
import { updateSettings } from './updateSettings';
import { signup } from './signup';
import { searchTour, getOverview } from './search';

// DOM elements ->>
const mapBox = document.getElementById('map'); 
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updateSettingsForm = document.querySelector('.form-user-settings');
const searchForm = document.querySelector('.nav__search');
// Values ->>
//const searchValue = document.querySelector('.nav__search-input').value;

// Dedication ->>
if (mapBox) {
	const locations = JSON.parse(mapBox.dataset.locations);
	displayMap(locations);
}
if (loginForm) {

	console.log('login form found');
	loginForm.addEventListener('submit', e => {

		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;

		e.preventDefault();		// <- Prevents from submiting the first time the page opens
		login(email, password);
	});
}
if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (signupForm) {

	console.log('signup form found');

	signupForm.addEventListener('submit', e => {
		e.preventDefault();	

		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;
		const passwordConfirm = document.getElementById('passwordConfirm').value;
		const name = document.getElementById('name').value;

		console.log('signupbtn working..');

		signup(name, email, password, passwordConfirm);

	})
	
}
if (updateDataForm) {
	//console.log('btn found');
	updateDataForm.addEventListener('submit', e => {
		e.preventDefault();		// <- Prevents from submiting the first time the page opens

		const email = document.getElementById('email').value;
		const name = document.getElementById('name').value;
		const photo = document.getElementById('photo').files[0];

		const form = new FormData();
		form.append('name', name);
		form.append('email', email);
		form.append('photo', photo);

		console.log(form);
		
		updateSettings(form, 'data');
	});
}
if (updateSettingsForm) {
	updateSettingsForm.addEventListener('submit', async e => {
		const password = document.getElementById('password-current').value;
		const newPassword = document.getElementById('password').value;
		const confirmNewPassword = document.getElementById('password-confirm').value;

		e.preventDefault();

		document.querySelector('.btn--save-password').innerHTML = 'Updating...';
		await updateSettings({ password, newPassword, confirmNewPassword }, 'password');

		document.getElementById('password-current').value= '';
		document.getElementById('password').value= '';
		document.getElementById('password-confirm').value= '';
	});
}
if (searchForm) {
	
	searchForm.addEventListener('submit', e => {
		e.preventDefault();
		const searchValue = document.querySelector('.nav__search-input').value.trim();

		if (searchValue) searchTour(searchValue);
		else getOverview();
		
		document.querySelector('.nav__search-input').value = searchValue;
	})
}