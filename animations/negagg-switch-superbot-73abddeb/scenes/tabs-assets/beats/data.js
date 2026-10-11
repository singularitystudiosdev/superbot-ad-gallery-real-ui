// The three listings every beat of the spot talks about, so the thread visibly carries over: the same names, rents,
// photos and neighbourhoods from the search (beats/listings.js) to the ranking (beats/rank.js) to the message
// (beats/message.js). Building names, rents, distances and ride times are invented for the demo; the parks and
// neighbourhoods are real Austin places used only as location tags. Photos: img/CREDITS.txt.
export const LISTINGS = [
  { id: 'bouldin', name: 'Bouldin Row', hood: 'Bouldin Creek', rent: '$1,975', bd: 2, ba: 1, sqft: '880 sq ft', park: '0.4 mi to Zilker Park', tags: ['In-unit W/D', 'Cats OK'], photo: 'apt-bouldin.jpg', ride: 11, miles: '2.0 mi' },
  { id: 'eastline', name: 'Eastline Lofts', hood: 'East Cesar Chavez', rent: '$1,895', bd: 2, ba: 2, sqft: '940 sq ft', park: '0.3 mi to Fiesta Gardens', tags: ['In-unit W/D', 'Balcony'], photo: 'apt-eastline.jpg', ride: 8, miles: '1.4 mi' },
  { id: 'hyde', name: 'Hyde Park Flats', hood: 'Hyde Park', rent: '$1,850', bd: 2, ba: 1, sqft: '820 sq ft', park: '0.2 mi to Shipe Park', tags: ['Covered parking', 'Dogs OK'], photo: 'apt-hyde.jpg', ride: 19, miles: '3.9 mi' },
];
export const WINNER = LISTINGS[1]; // the shortest bike ride downtown
