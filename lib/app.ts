import packageInfo from '../package.json';
import env from './env';

const app = {
  version: packageInfo.version,
  name: 'AIVO',
  logoUrl: '/logo.png',
  url: env.appUrl,
};

export default app;
