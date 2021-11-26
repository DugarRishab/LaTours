/* eslint-disable*/
//console.log('MAP STARTING...');


export const displayMap =  locations => {
	mapboxgl.accessToken =
	'pk.eyJ1IjoicmlzaGFiZHVnYXIiLCJhIjoiY2t3NmY2cTh3MWlxajJ3cDZxa3VvaXlteiJ9.DNvx_nfnyGiYekihwnr2AA';

var map = new mapboxgl.Map({
	container: 'map',	// <- Id of the container
	style: 'mapbox://styles/rishabdugar/ckw6j60y91qj414mvvkcbfb3c',
	scrollZoom: 'false'
	// center: [],
	// zoom: 10,
	// interactive: false
});
const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
	// Create Marker ->
	const el = document.createElement('div');
	el.className = 'marker';

	// Add Marker ->
	new mapboxgl.Marker({
		element: el,
		anchor: 'bottom'
	}).setLngLat(loc.coordinates).addTo(map);

	// Extends the map bounds
	bounds.extend(loc.coordinates);

	// add popup
	new mapboxgl
		.Popup({ offset: 30 })
		.setLngLat(loc.coordinates)
		.setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
		.addTo(map);
});

map.fitBounds(bounds, {
	padding: {
		top: 200,
		bottom: 100,
		left: 100,
		right: 100
	}
});
}

