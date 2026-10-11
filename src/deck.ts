import type * as Phaser from "phaser";
import Card from "./card";
import {
  NUM_VALUES,
  STACK_OFFSET,
  SUIT_COLOR,
  Suit,
  TABLEAU_BOTTOM,
  CARD_DIMENSIONS,
} from "./constants/deck";
import {
  ALL_PILES,
  FOUNDATION_PILES,
  FREECELL_PILES,
  PILE_POSITIONS,
  PileId,
  TABLEAU_PILES,
} from "./constants/table";
import { DEPTH } from "./constants/depth";
import { dealOrder } from "./deal";
import { canStack, isSequence, maxMovable } from "./rules";

export type Piles = ReadonlyMap<PileId, readonly Card[]>;

export interface Move {
  cards: Card[];
  from: PileId;
  to: PileId;
}

const emptyPiles = (): Map<PileId, Card[]> =>
  new Map(ALL_PILES.map((pile) => [pile, []]));

const isTableau = (pile: PileId): boolean => TABLEAU_PILES.includes(pile);
const isFoundation = (pile: PileId): boolean => FOUNDATION_PILES.includes(pile);
const isFreeCell = (pile: PileId): boolean => FREECELL_PILES.includes(pile);

/**
 * Board state: which cards are in which pile, and the rules for moving them.
 */
export default class Deck {
  public readonly cards: Card[] = [];

  private piles = emptyPiles();

  public constructor(scene: Phaser.Scene) {
    for (let value = 1; value <= NUM_VALUES; value += 1) {
      Object.values(Suit).forEach((suit) => {
        this.cards.push(new Card(scene, suit, value));
      });
    }
  }

  public deal(dealNumber: number): void {
    this.piles = emptyPiles();

    dealOrder(dealNumber).forEach(({ suit, value }, i) => {
      const card = this.cards.find((c) => c.suit === suit && c.value === value);
      if (card !== undefined) {
        this.cardsIn(TABLEAU_PILES[i % TABLEAU_PILES.length]).push(card);
      }
    });
  }

  public snapshot(): Piles {
    return new Map(ALL_PILES.map((pile) => [pile, [...this.cardsIn(pile)]]));
  }

  public restore(piles: Piles): void {
    this.piles = new Map(
      ALL_PILES.map((pile) => [pile, [...(piles.get(pile) ?? [])]])
    );
  }

  public pileOf(card: Card): PileId {
    return (
      ALL_PILES.find((pile) => this.cardsIn(pile).includes(card)) ??
      ALL_PILES[0]
    );
  }

  public top(pile: PileId): Card | undefined {
    return this.cardsIn(pile).at(-1);
  }

  public isEmpty(pile: PileId): boolean {
    return this.cardsIn(pile).length === 0;
  }

  public isWon(): boolean {
    return FOUNDATION_PILES.every(
      (pile) => this.cardsIn(pile).length === NUM_VALUES
    );
  }

  /**
   * Cards that move together when the player picks up `card`, or null when the
   * card cannot be picked up.
   */
  public pickUp(card: Card): Card[] | null {
    const pile = this.pileOf(card);
    if (isFoundation(pile)) {
      return null;
    }

    const cards = this.cardsIn(pile).slice(this.cardsIn(pile).indexOf(card));
    return isSequence(cards) ? cards : null;
  }

  /**
   * Largest stack that can move, given free space. A move to an empty column
   * cannot use that column as free space.
   */
  public maxMovable(toEmptyColumn: boolean): number {
    const freeCells = FREECELL_PILES.filter((p) => this.isEmpty(p)).length;
    const emptyColumns = TABLEAU_PILES.filter((p) => this.isEmpty(p)).length;
    return maxMovable(freeCells, emptyColumns - (toEmptyColumn ? 1 : 0));
  }

  public canMove(cards: readonly Card[], to: PileId): boolean {
    if (cards.length === 0 || this.pileOf(cards[0]) === to) {
      return false;
    }

    if (isFoundation(to)) {
      return cards.length === 1 && this.foundationFor(cards[0]) === to;
    }

    if (isFreeCell(to)) {
      return cards.length === 1 && this.isEmpty(to);
    }

    const target = this.top(to);
    if (target === undefined) {
      return cards.length <= this.maxMovable(true);
    }

    return canStack(target, cards[0]) && cards.length <= this.maxMovable(false);
  }

  public move(cards: readonly Card[], to: PileId): Move {
    const from = this.pileOf(cards[0]);
    this.piles.set(
      from,
      this.cardsIn(from).filter((c) => !cards.includes(c))
    );
    this.cardsIn(to).push(...cards);
    return { cards: [...cards], from, to };
  }

  /**
   * Best move for a tap or double-click on `card`: to a foundation, then onto
   * a tableau card, then to a free cell, then to an empty column. Moving a
   * whole column to an empty column is skipped as pointless.
   */
  public quickMove(card: Card): Move | null {
    const cards = this.pickUp(card);
    if (cards === null) {
      return null;
    }

    const from = this.pileOf(card);
    const wholeColumn =
      isTableau(from) && cards.length === this.cardsIn(from).length;
    const emptyColumns = TABLEAU_PILES.filter((p) => this.isEmpty(p));

    const to = [
      ...FOUNDATION_PILES,
      ...TABLEAU_PILES.filter((p) => !this.isEmpty(p)),
      ...(isTableau(from) ? FREECELL_PILES : []),
      ...(wholeColumn ? [] : emptyColumns),
    ].find((pile) => this.canMove(cards, pile));

    return to === undefined ? null : { cards, from, to };
  }

  /**
   * Foundation pile that accepts `card` next, or null.
   */
  public foundationFor(card: Card): PileId | null {
    const match = FOUNDATION_PILES.find((pile) => {
      const top = this.top(pile);
      return top?.suit === card.suit && top.value === card.value - 1;
    });
    if (match !== undefined) {
      return match;
    }

    if (card.value === 1) {
      return FOUNDATION_PILES.find((pile) => this.isEmpty(pile)) ?? null;
    }

    return null;
  }

  /**
   * Next card that is safe to play to a foundation automatically: no card left
   * in play could need it. That is true when both foundations of the opposite
   * colour hold at least `value - 1` cards.
   */
  public nextAutoMove(): { card: Card; to: PileId } | null {
    for (const pile of [...FREECELL_PILES, ...TABLEAU_PILES]) {
      const card = this.top(pile);
      const to = card === undefined ? null : this.foundationFor(card);
      if (card !== undefined && to !== null && this.isSafeToPlay(card)) {
        return { card, to };
      }
    }

    return null;
  }

  /**
   * False when the player has no legal move left. With a free cell or empty
   * column there is always a move. Otherwise only single cards can move.
   */
  public hasMoves(): boolean {
    if ([...FREECELL_PILES, ...TABLEAU_PILES].some((p) => this.isEmpty(p))) {
      return true;
    }

    return [...FREECELL_PILES, ...TABLEAU_PILES].some((from) => {
      const card = this.top(from);
      if (card === undefined) {
        return false;
      }

      return (
        this.foundationFor(card) !== null ||
        TABLEAU_PILES.some((to) => to !== from && this.canMove([card], to))
      );
    });
  }

  /**
   * Position every card in `pile`. Long tableau columns squeeze together so
   * the last card stays on screen.
   */
  public layout(pile: PileId, animate: boolean): void {
    const cards = this.cardsIn(pile);
    const { x, y } = PILE_POSITIONS[pile];

    let offset = 0;
    if (isTableau(pile) && cards.length > 1) {
      const room = TABLEAU_BOTTOM - CARD_DIMENSIONS.height / 2 - y;
      offset = Math.min(STACK_OFFSET, Math.floor(room / (cards.length - 1)));
    }

    cards.forEach((card, i) => {
      card.moveTo(x, y + i * offset, DEPTH.card + i, animate);
    });
  }

  public layoutAll(animate: boolean): void {
    ALL_PILES.forEach((pile) => {
      this.layout(pile, animate);
    });
  }

  private cardsIn(pile: PileId): Card[] {
    let cards = this.piles.get(pile);
    if (cards === undefined) {
      cards = [];
      this.piles.set(pile, cards);
    }
    return cards;
  }

  private foundationLevel(suit: Suit): number {
    const pile = FOUNDATION_PILES.find(
      (p) => this.cardsIn(p)[0]?.suit === suit
    );
    return pile === undefined ? 0 : this.cardsIn(pile).length;
  }

  private isSafeToPlay(card: Card): boolean {
    if (card.value <= 2) {
      return true;
    }

    return Object.values(Suit)
      .filter((suit) => SUIT_COLOR[suit] !== SUIT_COLOR[card.suit])
      .every((suit) => this.foundationLevel(suit) >= card.value - 1);
  }
}
