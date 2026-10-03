// The one table of release facts every beat and the Bandcamp page read. Everything here is made up for the spot
// (img/CREDITS.txt DATA): the artist, the single, the friend who mixed it, the lyrics (an original verse written for
// the ad, not a real song's words), the tags and every number. Artist name check (2026-10-03): the brief's first
// name "Wren Calloway" belongs to a real musician online (wrencalloway.com, YouTube, SoundCloud), so it was dropped;
// "Nell Ardmore" has no Bandcamp artist (bandcamp.com search API) and nellardmore.bandcamp.com is unclaimed (it
// redirects to Bandcamp's signup?new_domain= page), and a web search finds no one of that name.
export const REL = {
  artist: 'Nell Ardmore',
  title: 'Last Bus Home',
  domain: 'nellardmore.bandcamp.com',
  file: 'last-bus-home.wav',
  cover: 'cover.jpg',
  mixer: 'Ines Calder',
  about: ['Written on the night bus after a late shift.', 'Recorded in my kitchen with one mic and a borrowed Rhodes.'],
  credits: ['Written and performed by Nell Ardmore', 'Recorded at home', 'Mixed by Ines Calder'],
  tags: ['indie folk', 'bedroom pop', 'singer-songwriter', 'lo-fi', 'folk', 'acoustic', 'rhodes', 'night'],
  lyrics: [
    'The window holds my face against the rain,',
    'the driver hums a tune without a name,',
    'I count the stops instead of what I said,',
    'last bus home, the city going to bed.',
  ],
};
