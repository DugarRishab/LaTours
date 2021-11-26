import axios from 'axios';
import { showAlert} from './alerts'

export const login = async (email, password) => {
	//alert(email + " " +  password);
	try {
		//console.log("working..");
		const res = await axios({				// <- 3rd Party library that makes the AJAx calls
			method: 'POST',						// <- Axios also triggers the errors
			url: 'http://127.0.0.1:3000/api/v1/users/login',
			data: {
				email,
				password
			}
		});
		console.log(res);

		if (res.data.status === 'success') {
			showAlert('success', 'logged in successfully');
			window.setTimeout(() => {
				location.assign('/');
			}, 1500);
		}
	}
	catch(err) {
		showAlert('error', err.response.data.message);
	}
}
export const logout = async () => {
	try {
		const res = await axios({
			method: 'GET',
			url: 'http://127.0.0.1:3000/api/v1/users/logout'
		});
		console.log(res);
		if (res.data.status === 'Success') {
			showAlert('success', 'logged out successfully');
			window.setTimeout(() => {
				location.assign('/');
			}, 1500);
		}	
	}
	catch (err) {
		showAlert('error', 'Error loggin out! Please try again later');
		console.log(err);
		//console.log(res);
	}
}