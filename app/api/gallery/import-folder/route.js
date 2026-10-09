import { route } from '@/server/http';
import * as gallery from '@/server/controllers/gallery.controller';

export const POST = route(gallery.importFolder, { roles: ['admin'] });
