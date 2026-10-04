// scenes/yt/content.js: every string and image shown on the YouTube screens of this spot (EXACT, from the spec's
// "Cast and content"). The one source constant: scenes/yt/studio.js, scenes/yt/watch.js, scenes/yt/posts.js and the
// motion scenes import these read-only. Policy: no em or en dashes, no relative times on anything Sam (superbot)
// posts; viewer comment ages are content and allowed.
//
// Exports
//   img(file)          absolute URL of AD/img/gen/<file> (cache-busted with the entry tag)
//   brandUrl(file)     absolute URL of AD/brand/<file>
//   IMG                { sam, lena, marco, priya, dee, tom, hannah, jun, thumb, frame438, communityPost, banner } -> URL
//   CREATOR            { name, handle, subscribers, videos, avatar, banner, initial }
//   VIDEO              { title, length, views, viewsShort, published, comments, thumb, frame438 }
//   COMMENTS           the 5 top comments in Studio "Top comments" order (before the pin):
//                      { id, name, handle, avatar, age, text, likes }  ids: lena marco priya dee tom
//   EXTRA_COMMENTS     the 2 filler commenters: ids hannah jun
//   ALL_COMMENTS       COMMENTS then EXTRA_COMMENTS
//   COMMENT_BY_ID      { <id>: comment }
//   REPLIES            Sam's replies keyed by commenter id (NO timestamp is ever shown on these)
//   REPLY_ORDER        the order superbot posts them in Studio: priya lena marco dee tom
//   PINNED_ID          'priya'
//   PIN_LABEL          'Pinned by Sam Rivera'
//   PINNED_ORDER       the top-comment order after the pin: priya lena marco dee tom
//   POST               the community post { author, avatar, text, image, likes: '' }  (no timestamp, YouTube's empty like state)
//   STATS              channel stats strings { subscribers, videos, line }

const V = '0311b486';
export const img = (f) => new URL(`../../img/gen/${f}?v=${V}`, import.meta.url).href;
export const brandUrl = (f) => new URL(`../../brand/${f}?v=${V}`, import.meta.url).href;

export const IMG = {
  sam: img('sam.jpg'),
  lena: img('lena.jpg'),
  marco: img('marco.jpg'),
  priya: img('priya.jpg'),
  dee: img('dee.jpg'),
  tom: img('tom.jpg'),
  hannah: img('hannah.jpg'),
  jun: img('jun.jpg'),
  thumb: img('thumb.jpg'),
  frame438: img('frame-438.jpg'),
  communityPost: img('community-post.jpg'),
  banner: img('banner.jpg'),
};

export const CREATOR = {
  name: 'Sam Rivera',
  handle: '@samriveratests',
  subscribers: '248K subscribers',
  videos: '312 videos',
  avatar: IMG.sam,
  banner: IMG.banner,
  initial: 'S',
};

export const STATS = {
  subscribers: CREATOR.subscribers,
  videos: CREATOR.videos,
  line: `${CREATOR.handle} • ${CREATOR.subscribers} • ${CREATOR.videos}`,
};

export const VIDEO = {
  title: 'I tested 12 budget mics under $100',
  length: '14:32',
  views: '61,842 views',
  viewsShort: '61K views',
  published: 'Sep 28, 2026',
  comments: '1,284 comments',
  commentCount: '1,284',
  thumb: IMG.thumb,
  frame438: IMG.frame438,
};

const c = (id, name, handle, age, text, likes) => ({ id, name, handle, avatar: IMG[id], age, text, likes });

export const COMMENTS = [
  c('lena', 'Lena Fischer', '@lenafischer', '2 days ago', "What's that boom arm at 4:38? Looks so clean on the desk.", '986'),
  c('marco', 'Marco Silva', '@marcosilva', '2 days ago', 'The $29 one sounding that close to the $99 one is wild.', '742'),
  c('priya', 'Priya Nair', '@priyanair', '2 days ago', 'Which one would you actually buy for a small untreated room?', '2.1K'),
  c('dee', 'Dee Okafor', '@deeokafor', '1 day ago', 'Please do headsets next, my stream mic budget is gone.', '518'),
  c('tom', 'Tom Becker', '@tombecker', '1 day ago', 'Did not expect the USB one to beat the XLR at 8:12.', '403'),
];

export const EXTRA_COMMENTS = [
  c('hannah', 'Hannah Cole', '@hannahcole', '3 days ago', 'Subscribed for the side by side clips, finally someone tests in a normal room.', '211'),
  c('jun', 'Jun Park', '@junpark', '3 days ago', '8:12 had me checking my own USB mic settings.', '164'),
];

export const ALL_COMMENTS = [...COMMENTS, ...EXTRA_COMMENTS];
export const COMMENT_BY_ID = Object.fromEntries(ALL_COMMENTS.map((x) => [x.id, x]));

export const REPLIES = {
  priya: 'The $49 dynamic. It ignores most of the room echo, you can hear it side by side at 7:05.',
  lena: 'Low-profile boom arm, mic mounted underneath. Linked it in the description.',
  marco: "My editor fell for the $29 one too. It's the sleeper of the whole video.",
  dee: "Headsets are already on the list. They're next.",
  tom: 'Same here, the USB one surprised me most.',
};
export const REPLY_ORDER = ['priya', 'lena', 'marco', 'dee', 'tom'];

export const PINNED_ID = 'priya';
export const PIN_LABEL = 'Pinned by Sam Rivera';
export const PINNED_ORDER = ['priya', 'lena', 'marco', 'dee', 'tom'];

export const POST = {
  author: CREATOR.name,
  handle: CREATOR.handle,
  avatar: CREATOR.avatar,
  text: 'Headsets are next. 10 under $100 are already on my desk. Which one should I test first?',
  image: IMG.communityPost,
  likes: '',
};
