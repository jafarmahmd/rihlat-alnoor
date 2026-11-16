import { MasoomProfile } from '../types/game';
import { LIBRARY_PART_1 } from './library/part1';
import { LIBRARY_PART_2 } from './library/part2';
import { LIBRARY_PART_3 } from './library/part3';
import { LIBRARY_PART_4 } from './library/part4';

export const MASOOMEEN_LIBRARY: MasoomProfile[] = [
  ...LIBRARY_PART_1,
  ...LIBRARY_PART_2,
  ...LIBRARY_PART_3,
  ...LIBRARY_PART_4,
];
