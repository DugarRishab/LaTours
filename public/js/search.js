export const searchTour = (searchValue) => {

	const query = searchValue.trim().toLowerCase().replace(/ /g, '-');
	location.assign(`/?slug=${query}`);
}

export const getOverview = () => {
	location.assign(`/`);
} 