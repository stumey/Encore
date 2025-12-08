import { Router } from 'express';
import usersRoutes from './users.routes';
import concertsRoutes from './concerts.routes';
import mediaRoutes from './media.routes';
import artistsRoutes from './artists.routes';
import setlistsRoutes from './setlists.routes';
import venuesRoutes from './venues.routes';

const router = Router();

router.use('/users', usersRoutes);
router.use('/concerts', concertsRoutes);
router.use('/media', mediaRoutes);
router.use('/artists', artistsRoutes);
router.use('/setlists', setlistsRoutes);
router.use('/venues', venuesRoutes);

export default router;
