import '@babel/polyfill';

export const searchTour = (searchValue) => {

	const query = searchValue.toLowerCase().replace(/ /g, '-');
	location.assign(`/?slug=${query}`);
	console.log(query);
}

export const getOverview = () => {
	location.assign(`/`);
} 