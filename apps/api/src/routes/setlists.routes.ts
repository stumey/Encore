import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { syncUser } from '../middleware/syncUser';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { setlistService } from '../services';

const router = Router();

// GET /setlists/search - Search setlists
router.get(
  '/search',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const { artistMbid, date, venue } = z
      .object({
        artistMbid: z.string(),
        date: z.string().optional(), // dd-MM-yyyy
        venue: z.string().optional(),
      })
      .parse(req.query);

    const results = await setlistService.searchSetlists(artistMbid, date, venue);

    res.json({ data: results });
  })
);

// GET /setlists/venue-lineup - Get all artists who performed at a venue on a date
router.get(
  '/venue-lineup',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const { venueId, date } = z
      .object({
        venueId: z.string(),    // Setlist.fm venue ID
        date: z.string(),       // dd-MM-yyyy format
      })
      .parse(req.query);

    const lineup = await setlistService.getVenueLineup(venueId, date);

    res.json({ data: lineup });
  })
);

// GET /setlists/:setlistFmId - Get setlist from Setlist.fm
router.get(
  '/:setlistFmId',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const setlist = await setlistService.getSetlist(req.params.setlistFmId);
    res.json({ data: setlist });
  })
);

// POST /setlists/concerts/:concertId - Attach setlist to concert
router.post(
  '/concerts/:concertId',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const { setlistFmId } = z.object({ setlistFmId: z.string() }).parse(req.body);

    // Verify concert ownership
    const concert = await prisma.concert.findFirst({
      where: { id: req.params.concertId, userId: req.user!.userId },
    });

    if (!concert) {
      throw new AppError('Concert not found', 404);
    }

    // Fetch setlist from Setlist.fm
    const setlistData = await setlistService.getSetlist(setlistFmId);

    // Extract songs
    const songs = setlistData.sets?.set?.flatMap((set, setIndex) =>
      set.song.map((song, songIndex) => ({
        position: setIndex * 100 + songIndex + 1,
        name: song.name,
        encore: setIndex > 0,
      }))
    ) || [];

    // Create or update setlist
    const setlist = await prisma.setlist.upsert({
      where: { concertId: concert.id },
      create: {
        concertId: concert.id,
        setlistFmId,
        songs,
      },
      update: {
        setlistFmId,
        songs,
      },
    });

    res.json({ data: setlist });
  })
);

// DELETE /setlists/concerts/:concertId - Remove setlist from concert
router.delete(
  '/concerts/:concertId',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const concert = await prisma.concert.findFirst({
      where: { id: req.params.concertId, userId: req.user!.userId },
    });

    if (!concert) {
      throw new AppError('Concert not found', 404);
    }

    await prisma.setlist.deleteMany({ where: { concertId: concert.id } });

    res.status(204).send();
  })
);

export default router;
