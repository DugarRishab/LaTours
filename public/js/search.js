export const searchTour = (searchValue) => {

	const query = searchValue.toLowerCase().replace(/ /g, '-');
	location.assign(`/?slug=${query}`);
}

export const getOverview = () => {
	location.assign(`/`);
} 