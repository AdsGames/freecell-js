import { CARD_DIMENSIONS } from "./deck";

/**
 * Define the constants for the table.
 */
export enum PileId {
  Tableau1 = "TABLEAU_1",
  Tableau2 = "TABLEAU_2",
  Tableau3 = "TABLEAU_3",
  Tableau4 = "TABLEAU_4",
  Tableau5 = "TABLEAU_5",
  Tableau6 = "TABLEAU_6",
  Tableau7 = "TABLEAU_7",
  Tableau8 = "TABLEAU_8",
  Foundation1 = "FOUNDATION_1",
  Foundation2 = "FOUNDATION_2",
  Foundation3 = "FOUNDATION_3",
  Foundation4 = "FOUNDATION_4",
  FreeCell1 = "FREECELL_1",
  FreeCell2 = "FREECELL_2",
  FreeCell3 = "FREECELL_3",
  FreeCell4 = "FREECELL_4",
  None = "NONE",
}

/**
 * Define tableau piles
 */
export const TABLEAU_PILES = [
  PileId.Tableau1,
  PileId.Tableau2,
  PileId.Tableau3,
  PileId.Tableau4,
  PileId.Tableau5,
  PileId.Tableau6,
  PileId.Tableau7,
  PileId.Tableau8,
];

/**
 * Define foundation piles
 */
export const FOUNDATION_PILES = [
  PileId.Foundation1,
  PileId.Foundation2,
  PileId.Foundation3,
  PileId.Foundation4,
];

/**
 * Define freecell piles
 */
export const FREECELL_PILES = [
  PileId.FreeCell1,
  PileId.FreeCell2,
  PileId.FreeCell3,
  PileId.FreeCell4,
];

/**
 * Offsets for card positions
 */
const PILE_OFFSET = CARD_DIMENSIONS.width + 10;
const TOP_OFFSET = CARD_DIMENSIONS.width + 6;

/**
 * Positions of piles on screen
 */
export const PILE_POSITIONS: Record<PileId, Phaser.Math.Vector2> = {
  [PileId.FreeCell1]: new Phaser.Math.Vector2(68, 100),
  [PileId.FreeCell2]: new Phaser.Math.Vector2(68 + TOP_OFFSET, 100),
  [PileId.FreeCell3]: new Phaser.Math.Vector2(68 + 2 * TOP_OFFSET, 100),
  [PileId.FreeCell4]: new Phaser.Math.Vector2(68 + 3 * TOP_OFFSET, 100),

  [PileId.Foundation1]: new Phaser.Math.Vector2(454, 100),
  [PileId.Foundation2]: new Phaser.Math.Vector2(454 + TOP_OFFSET, 100),
  [PileId.Foundation3]: new Phaser.Math.Vector2(454 + 2 * TOP_OFFSET, 100),
  [PileId.Foundation4]: new Phaser.Math.Vector2(454 + 3 * TOP_OFFSET, 100),

  [PileId.Tableau1]: new Phaser.Math.Vector2(68, 240),
  [PileId.Tableau2]: new Phaser.Math.Vector2(68 + PILE_OFFSET, 240),
  [PileId.Tableau3]: new Phaser.Math.Vector2(68 + 2 * PILE_OFFSET, 240),
  [PileId.Tableau4]: new Phaser.Math.Vector2(68 + 3 * PILE_OFFSET, 240),
  [PileId.Tableau5]: new Phaser.Math.Vector2(68 + 4 * PILE_OFFSET, 240),
  [PileId.Tableau6]: new Phaser.Math.Vector2(68 + 5 * PILE_OFFSET, 240),
  [PileId.Tableau7]: new Phaser.Math.Vector2(68 + 6 * PILE_OFFSET, 240),
  [PileId.Tableau8]: new Phaser.Math.Vector2(68 + 7 * PILE_OFFSET, 240),

  [PileId.None]: new Phaser.Math.Vector2(0, 0),
};
