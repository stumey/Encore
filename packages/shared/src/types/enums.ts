export const MediaType = {
  photo: 'photo',
  video: 'video',
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const VenueType = {
  arena: 'arena',
  stadium: 'stadium',
  club: 'club',
  theater: 'theater',
  festival: 'festival',
  outdoor: 'outdoor',
  unknown: 'unknown',
} as const;

export type VenueType = (typeof VenueType)[keyof typeof VenueType];

export const TicketSource = {
  // Major ticketing platforms
  ticketmaster: 'ticketmaster',
  livenation: 'livenation',
  axs: 'axs',
  seatgeek: 'seatgeek',
  stubhub: 'stubhub',
  vividseats: 'vividseats',
  eventbrite: 'eventbrite',
  dice: 'dice',
  bandsintown: 'bandsintown',
  seetickets: 'seetickets',
  eventim: 'eventim',
  universe: 'universe',
  tixr: 'tixr',
  etix: 'etix',
  frontgate: 'frontgate',

  // Import methods
  pdf: 'pdf',
  email: 'email',
  appleWallet: 'apple_wallet',
  googleWallet: 'google_wallet',
  screenshot: 'screenshot',

  // Other entry types
  manual: 'manual',
  guestList: 'guest_list',
  comp: 'comp',
  willCall: 'will_call',
} as const;

export type TicketSource = (typeof TicketSource)[keyof typeof TicketSource];

export const AnalysisStatus = {
  pending: 'pending',
  processing: 'processing',
  completed: 'completed',
  failed: 'failed',
} as const;

export type AnalysisStatus = (typeof AnalysisStatus)[keyof typeof AnalysisStatus];

export const EventType = {
  concert: 'concert',
  festival: 'festival',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];
