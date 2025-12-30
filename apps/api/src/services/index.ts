export { s3Service } from './s3.service';
export {
  claudeService,
  type PhotoAnalysis,
  type PhotoMetadata,
  type ArtistAnalysis,
  type VenueAnalysis,
  type TourAnalysis,
} from './claude.service';
export { setlistService, type Setlist, type SetlistArtist } from './setlist.service';
export { geniusService, type GeniusArtist } from './genius.service';

// Future: Audio recognition service (Shazam/ACRCloud) for identifying songs from video audio
