import Card from "./card";
import { NUM_CARDS, NUM_VALUES, Suit } from "./constants/deck";
import { type PileId, TABLEAU_PILES } from "./constants/table";

export default class Deck {
  public cards: Card[] = [];

  public constructor(scene: Phaser.Scene) {
    for (let i = 1; i < NUM_VALUES + 1; i += 1) {
      Object.values(Suit).forEach((t) => {
        this.cards.push(new Card(scene, t, i));
      });
    }

    this.shuffle(this.cards);
    this.deal(scene);
  }

  public deal(scene: Phaser.Scene): void {
    // Flip all back
    this.cards.forEach((card: Card) => {
      card.flip(scene);
    });

    // Set positions
    let x = 0;
    while (x < NUM_CARDS) {
      const pileId = TABLEAU_PILES[x % TABLEAU_PILES.length];
      const card = this.cards[x];
      card.reposition(pileId, Math.floor(x / TABLEAU_PILES.length));
      x += 1;
    }
  }

  public shuffle(a: Card[]): Card[] {
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  public cardChildren(card: Card): Card[] {
    return this.cards
      .filter(
        (curr: Card) =>
          curr.pile === card.pile && curr.position >= card.position
      )
      .sort((a: Card, b: Card) => a.position - b.position);
  }

  public topCard(pile: PileId): Card | null {
    return (
      this.cards
        .filter((curr: Card) => curr.pile === pile)
        .sort((a: Card, b: Card) => a.position - b.position)
        .pop() ?? null
    );
  }

  public countCards(pile: PileId): number {
    return this.cards.reduce(
      (acc: number, card: Card) => (card.pile === pile ? acc + 1 : acc),
      0
    );
  }

  public isEmpty(pile: PileId): boolean {
    return this.countCards(pile) === 0;
  }
}
