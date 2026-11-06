import type { Character as Player } from './profiles';

const COLUMNS = 6;
const ROWS = 4;
const CELL_WIDTH = 209;
const CELL_HEIGHT = 313.5;

export default function Character({ character, stage = 0, className = '', portrait = false }: {
  character: Player;
  stage?: number;
  className?: string;
  portrait?: boolean;
}) {
  const column = Number.isFinite(character.skinTone) ? Math.max(0, Math.min(COLUMNS - 1, Math.floor(character.skinTone))) : 3;
  const row = Number.isFinite(stage) ? Math.max(0, Math.min(ROWS - 1, Math.floor(stage))) : 0;
  const bobHair = character.gender === 'woman';
  const atlas = bobHair ? '/art/characters-bob.png' : '/art/characters-short.png';
  // The generated sheets share a grid, but the bob-haired figures sit 10px
  // farther left. Frame each silhouette without stretching its proportions.
  const frameLeft = bobHair ? 40 : 50;

  return <svg className={className} viewBox={portrait ? `${frameLeft} 4 164 164` : `${frameLeft} 0 164 ${CELL_HEIGHT}`}
    role="img" aria-label={character.name + '’s character'} overflow="hidden">
    {/* Clip to one atlas cell so neighbouring sprites cannot enter the frame. */}
    <svg x="0" y="0" width={CELL_WIDTH} height={CELL_HEIGHT}
      viewBox={`${column} ${row} 1 1`} preserveAspectRatio="none" overflow="hidden" aria-hidden="true">
      <image href={atlas} width={COLUMNS} height={ROWS} preserveAspectRatio="none" style={{ imageRendering: 'pixelated' }} />
    </svg>
  </svg>;
}
