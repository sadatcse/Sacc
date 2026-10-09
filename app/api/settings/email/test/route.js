import { route } from '@/server/http';
import * as settings from '@/server/controllers/settings.controller';

export const POST = route(settings.testEmail, { roles: ['admin'] });
