import axios from 'axios';
import { showAlert} from './alerts'

export const updateSettings = async (data, type) => { // <- type is either data or password

	try {
		const res = await axios({					// <- 3rd Party library that makes the AJAx calls
			method: 'PATCH',						// <- Axios also triggers the errors
			url: `${(type ==='data')? 'http://127.0.0.1:3000/api/v1/users/updateMyData'  : 'http://127.0.0.1:3000/api/v1/users/updateMyPassword' }`,
			data
		});
		//console.log('RESPONSE FROM SERVER -> ', res);
	
		if (res.data.status === 'success') {
			showAlert('success', `${type.toUpperCase()} updated Successfuly! `);
			window.setTimeout(() => {
				location.assign('/me');
			}, 1500);
		}
	}
	catch (err) {
		showAlert('error', err.response.data.message);
	}
}
