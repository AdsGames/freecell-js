import { NUM_CARDS, Suit } from "./constants/deck";

/**
 * Suit order used by the Microsoft FreeCell deal algorithm.
 */
const MS_SUIT_ORDER = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];

export const MIN_DEAL = 1;
export const MAX_DEAL = 1_000_000;

export interface DealtCard {
  suit: Suit;
  value: number;
}

/**
 * Card order for a numbered deal, compatible with Microsoft FreeCell.
 * Card i of the result goes to tableau column i % 8.
 */
export const dealOrder = (dealNumber: number): DealtCard[] => {
  const deck = Array.from({ length: NUM_CARDS }, (_, i) => i);
  const order: number[] = [];
  let seed = dealNumber;

  for (let left = NUM_CARDS; left > 0; left -= 1) {
    seed = (seed * 214_013 + 2_531_011) % 2_147_483_648;
    const j = Math.floor(seed / 65_536) % left;
    order.push(deck[j]);
    deck[j] = deck[left - 1];
  }

  return order.map((i) => ({
    suit: MS_SUIT_ORDER[i % 4],
    value: Math.floor(i / 4) + 1,
  }));
};

export const isValidDeal = (n: number): boolean =>
  Number.isInteger(n) && n >= MIN_DEAL && n <= MAX_DEAL;

export const randomDeal = (): number =>
  Math.floor(Math.random() * 32_000) + MIN_DEAL;
