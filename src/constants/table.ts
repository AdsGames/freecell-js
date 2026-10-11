import * as Phaser from "phaser";

import { CARD_DIMENSIONS } from "./deck";
import { SCREEN_WIDTH } from "./screen";

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

export const ALL_PILES = [
  ...TABLEAU_PILES,
  ...FOUNDATION_PILES,
  ...FREECELL_PILES,
];

/**
 * The 8 tableau columns are centred on screen. In the top row, free cells
 * align with the left edge and foundations with the right edge, with a gap
 * between the two groups.
 */
const COLUMN_SPACING = CARD_DIMENSIONS.width + 10;
const TOP_ROW_SPACING = CARD_DIMENSIONS.width + 6;
const TABLE_WIDTH = 7 * COLUMN_SPACING + CARD_DIMENSIONS.width;

export const TABLE_LEFT = (SCREEN_WIDTH - TABLE_WIDTH) / 2;
export const TABLE_RIGHT = TABLE_LEFT + TABLE_WIDTH;

const TOP_ROW_Y = 100;
const TABLEAU_Y = 240;

const LEFT_X = TABLE_LEFT + CARD_DIMENSIONS.width / 2;
const RIGHT_X = TABLE_RIGHT - CARD_DIMENSIONS.width / 2;

const column = (i: number): Phaser.Math.Vector2 =>
  new Phaser.Math.Vector2(LEFT_X + i * COLUMN_SPACING, TABLEAU_Y);

const freeCell = (i: number): Phaser.Math.Vector2 =>
  new Phaser.Math.Vector2(LEFT_X + i * TOP_ROW_SPACING, TOP_ROW_Y);

const foundation = (i: number): Phaser.Math.Vector2 =>
  new Phaser.Math.Vector2(RIGHT_X - (3 - i) * TOP_ROW_SPACING, TOP_ROW_Y);

/**
 * Positions of piles on screen
 */
export const PILE_POSITIONS: Record<PileId, Phaser.Math.Vector2> = {
  [PileId.FreeCell1]: freeCell(0),
  [PileId.FreeCell2]: freeCell(1),
  [PileId.FreeCell3]: freeCell(2),
  [PileId.FreeCell4]: freeCell(3),

  [PileId.Foundation1]: foundation(0),
  [PileId.Foundation2]: foundation(1),
  [PileId.Foundation3]: foundation(2),
  [PileId.Foundation4]: foundation(3),

  [PileId.Tableau1]: column(0),
  [PileId.Tableau2]: column(1),
  [PileId.Tableau3]: column(2),
  [PileId.Tableau4]: column(3),
  [PileId.Tableau5]: column(4),
  [PileId.Tableau6]: column(5),
  [PileId.Tableau7]: column(6),
  [PileId.Tableau8]: column(7),
};
