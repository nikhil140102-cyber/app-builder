import type { AppBuilderPlugin } from '@/core/plugins';
import rating from './rating';

/** Plugins listed here are installed when the app starts. */
export const plugins: AppBuilderPlugin[] = [rating];
