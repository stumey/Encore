import { z } from 'zod';

// User schemas
export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  displayName: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  isPublic: z.boolean().optional(),
});

// Concert schemas - base object for reuse
const concertBaseSchema = z.object({
  concertDate: z.string().transform((s) => new Date(s)),
  concertEndDate: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  venueId: z.string().uuid().optional(),
  tourName: z.string().optional(),
  eventName: z.string().max(200).optional(),
  eventType: z.enum(['concert', 'festival']).optional(),
  notes: z.string().optional(),
  artists: z
    .array(
      z.object({
        artistId: z.string().uuid(),
        isHeadliner: z.boolean().default(false),
        setOrder: z.number().optional(),
      })
    )
    .optional(),
});

// Create schema with date validation
export const createConcertSchema = concertBaseSchema.refine(
  (data) => {
    if (!data.concertEndDate) return true;
    return data.concertEndDate >= data.concertDate;
  },
  { message: 'End date must be on or after start date', path: ['concertEndDate'] }
);

// Update schema - partial fields, validate dates if both provided
export const updateConcertSchema = concertBaseSchema.partial().refine(
  (data) => {
    if (!data.concertDate || !data.concertEndDate) return true;
    return data.concertEndDate >= data.concertDate;
  },
  { message: 'End date must be on or after start date', path: ['concertEndDate'] }
);

// Artist schemas
export const createArtistSchema = z.object({
  name: z.string().min(1),
  spotifyId: z.string().optional(),
  mbid: z.string().optional(),
  imageUrl: z.string().url().optional(),
  genres: z.array(z.string()).optional(),
});

// Venue schemas
export const createVenueSchema = z.object({
  name: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().int().positive().optional(),
});

// Media schemas
export const mediaTypeSchema = z.enum(['photo', 'video']);

export const uploadUrlSchema = z.object({
  contentType: z.string(),
  filename: z.string().optional(),
});

export const createMediaSchema = z.object({
  mediaType: mediaTypeSchema.default('photo'),
  storagePath: z.string(),
  thumbnailPath: z.string().optional(),
  originalFilename: z.string().optional(),
  duration: z.number().int().positive().optional(),
  takenAt: z.string().transform((s) => new Date(s)).optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  concertId: z.string().uuid().optional(),
});

export const updateMediaSchema = z.object({
  concertId: z.string().uuid().nullable().optional(),
});

// Setlist schemas
export const attachSetlistSchema = z.object({
  setlistFmId: z.string(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Type exports from schemas
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateConcertInput = z.infer<typeof createConcertSchema>;
export type UpdateConcertInput = z.infer<typeof updateConcertSchema>;
export type CreateArtistInput = z.infer<typeof createArtistSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
