import { SUIT_COLOR, type Suit } from "./constants/deck";

export interface CardValue {
  suit: Suit;
  value: number;
}

/**
 * True when `upper` can sit on `lower` in a tableau column.
 */
export const canStack = (lower: CardValue, upper: CardValue): boolean =>
  SUIT_COLOR[lower.suit] !== SUIT_COLOR[upper.suit] &&
  upper.value === lower.value - 1;

/**
 * True when every card in `cards` can sit on the card before it.
 */
export const isSequence = (cards: readonly CardValue[]): boolean =>
  cards.every((card, i) => i === 0 || canStack(cards[i - 1], card));

/**
 * Number of cards that can move as one stack, using free cells and empty
 * columns as temporary space.
 */
export const maxMovable = (freeCells: number, emptyColumns: number): number =>
  (freeCells + 1) * 2 ** emptyColumns;
