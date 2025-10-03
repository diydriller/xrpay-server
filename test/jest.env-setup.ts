import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile =
  process.env.NODE_ENV === 'test'
    ? path.resolve(process.cwd(), '.env.test.local')
    : path.resolve(process.cwd(), '.env');

dotenv.config({ path: envFile });
