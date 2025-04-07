import { setGlobalOptions } from 'firebase-functions/v2/options';
import { archiveCompletedTask } from './services/archive';

setGlobalOptions({ region: 'asia-southeast1' });

export { archiveCompletedTask };