/**
 * Prints the WCAG contrast table for every skin, light and dark. The numbers
 * quoted in the comment at the top of each `src/skins/*.ts` come from here.
 * `tests/unit/skins.test.ts` asserts the same thresholds so they cannot rot.
 */
import { contrast } from '../src/lib/contrast.ts';
import { SKIN_LIST } from '../src/skins/index.ts';
import type { Tokens } from '../src/skins/types.ts';

const PAIRS: ReadonlyArray<readonly [string, keyof Tokens, keyof Tokens]> = [
  ['ink / paper', 'ink', 'paper'],
  ['ink / ground', 'ink', 'ground'],
  ['ink-2 / paper', 'ink2', 'paper'],
  ['secondary / paper', 'secondary', 'paper'],
  ['accent / paper', 'accent', 'paper'],
  ['on-accent / accent', 'onAccent', 'accent'],
  ['secondary / secondary-soft', 'secondary', 'secondarySoft'],
  ['ink / accent-soft', 'ink', 'accentSoft'],
  ['ink / note', 'ink', 'note'],
  ['ink / egg', 'ink', 'egg'],
  ['focus / paper', 'focus', 'paper'],
];

for (const skin of SKIN_LIST) {
  console.log(`\n${skin.label}`);
  for (const mode of ['light', 'dark'] as const) {
    const tokens = skin[mode];
    const row = PAIRS.map(
      ([label, a, b]) => `${label} ${contrast(tokens[a], tokens[b]).toFixed(2)}`,
    ).join('  ');
    console.log(`  ${mode.padEnd(5)} ${row}`);
  }
}
