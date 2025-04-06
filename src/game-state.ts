/* eslint-disable max-lines-per-function */
/* eslint-disable max-lines */
import * as Phaser from "phaser";

import Deck from "./deck";
import Card from "./card";
import {
  FOUNDATION_PILES,
  FREECELL_PILES,
  PileId,
  TABLEAU_PILES,
} from "./constants/table";
import { STACK_DRAG_OFFSET } from "./constants/deck";
import { Pile } from "./pile";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "./constants/screen";

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  key: "GameState",
  visible: false,
};

export default class GameState extends Phaser.Scene {
  private score: number = 0;

  private dragChildren: Card[] = [];

  private deck!: Deck;

  private scoreText!: Phaser.GameObjects.Text;

  private winText!: Phaser.GameObjects.Text;

  public constructor() {
    super(sceneConfig);
  }

  public create(): void {
    // Game state variables
    this.score = 0;
    this.dragChildren = [];

    // Add background
    this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "img_background");

    // Add deck
    this.deck = new Deck(this);

    this.createZones();
    this.createInputListeners();
    this.createButtons();
    this.createText();
  }

  public createZones(): void {
    Object.values(PileId).forEach((pileId) => {
      const pile = new Pile(this, pileId);
      this.add.existing(pile);
    });
  }

  public createInputListeners(): void {
    // Start drag card
    this.input.on(
      "dragstart",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject
      ) => {
        if (gameObject instanceof Card) {
          this.dragCardStart(gameObject);
        }
      },
      this
    );

    // End drag card
    this.input.on(
      "dragend",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject
      ) => {
        if (gameObject instanceof Card) {
          this.dragCardEnd();
        }
      },
      this
    );

    // Drop on pile
    this.input.on(
      "drop",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dropZone: Phaser.GameObjects.GameObject
      ) => {
        if (gameObject instanceof Card) {
          this.dropCard(gameObject, dropZone);
        }
      },
      this
    );

    // Drag card
    this.input.on(
      "drag",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dragX: number,
        dragY: number
      ) => {
        if (gameObject instanceof Card) {
          this.dragCard(gameObject, dragX, dragY);
        }
      },
      this
    );
  }

  public createButtons(): void {
    // Redeal button
    this.add.graphics().fillStyle(0xffffff, 1).fillRect(24, 10, 80, 18);

    this.add
      .text(36, 10, "Redeal", { color: "#000" })
      .setInteractive()
      .on(
        "pointerdown",
        () => {
          this.deck.deal(this);
          this.winText.setVisible(false);
          this.score = 0;
        },
        this
      );

    // New deal button
    this.add.graphics().fillStyle(0xffffff, 1).fillRect(114, 10, 90, 18);

    this.add
      .text(120, 10, "New Deal", { color: "#000" })
      .setInteractive()
      .on(
        "pointerdown",
        () => {
          this.deck.shuffle(this.deck.cards);
          this.deck.deal(this);
          this.winText.setVisible(false);
          this.score = 0;
        },
        this
      );
  }

  public createText(): void {
    this.scoreText = this.add.text(700, 12, "", {
      color: "#FFF",
      fontSize: "16px",
    });

    this.winText = this.add
      .text(20, this.cameras.main.height - 40, "You Win!", {
        color: "#FFF",
        fontSize: "24px",
      })
      .setVisible(false);
  }

  public dropScore(zoneStack: PileId, cardStack: PileId): void {
    // Tableau to foundation
    if (
      TABLEAU_PILES.includes(cardStack) &&
      FOUNDATION_PILES.includes(zoneStack)
    ) {
      this.score += 10;
    }
  }

  public dragCardStart(card: Card): void {
    // Populate drag children
    this.dragChildren = [];

    // Validate stack for Tableau, otherwise drag single card
    if (TABLEAU_PILES.includes(card.pile)) {
      const children = this.deck.cardChildren(card);

      // Check to ensure sequence is valid
      let curr = card;
      for (let i = 1; i < children.length; i += 1) {
        if (
          children[i].getColour() === curr.getColour() ||
          children[i].value !== curr.value - 1
        ) {
          return;
        }
        curr = children[i];
      }

      /*
       * Check to ensure we are not dragging more cards than free cells and tableau
       * piles available
       */
      if (children.length > this.countMoves(false)) {
        return;
      }

      // Add children to dragChildren
      this.dragChildren = children;
    } else {
      this.dragChildren.push(card);
    }

    // Set depths
    for (let i = 0; i < this.dragChildren.length; i += 1) {
      this.dragChildren[i].setDepth(100 + i);
    }
  }

  public dragCardEnd(): void {
    // Drop all other cards on top
    this.dragChildren.forEach((child: Card) => {
      child.reposition(child.pile, child.position);
    });
  }

  public dragCard(_card: Card, dragX: number, dragY: number): void {
    // Set positions
    for (let i = 0; i < this.dragChildren.length; i += 1) {
      this.dragChildren[i].x = dragX;
      this.dragChildren[i].y = dragY + i * STACK_DRAG_OFFSET;
    }
  }

  // eslint-disable-next-line
  public dropCard(_card: Card, dropZone: Phaser.GameObjects.GameObject): void {
    console.log("dropCard", dropZone.name, this.dragChildren);
    // Get card
    if (this.dragChildren.length === 0) {
      return;
    }

    const [card] = this.dragChildren;

    // Potentially unsafe!
    const pileId = dropZone.name as PileId;

    // Get top card on current stack
    const topCard = this.deck.topCard(pileId);

    // Free cell
    if (FREECELL_PILES.includes(pileId)) {
      if (this.deck.isEmpty(pileId) && this.dragChildren.length === 1) {
        this.dropScore(pileId, card.pile);
        card.reposition(pileId, 0);
      }
    }

    // Tableau
    else if (TABLEAU_PILES.includes(pileId)) {
      if (!topCard) {
        // Dropping on the tableau invalidates the previous count
        if (this.dragChildren.length > this.countMoves(true)) {
          return;
        }

        this.dropScore(pileId, card.pile);
        card.reposition(pileId, 0);
      } else if (
        card.getColour() !== topCard.getColour() &&
        card.value === topCard.value - 1
      ) {
        this.dropScore(pileId, card.pile);
        card.reposition(pileId, topCard.position + 1);
      }
    }

    // Foundation
    else if (FOUNDATION_PILES.includes(pileId)) {
      if (!topCard) {
        if (card.value === 1) {
          this.dropScore(pileId, card.pile);
          card.reposition(pileId, 0);
        }
      } else if (
        card.suit === topCard.suit &&
        card.value === topCard.value + 1
      ) {
        this.dropScore(pileId, card.pile);
        card.reposition(pileId, topCard.position + 1);
      }
    }

    // Reset drag children
    for (let i = 1; i < this.dragChildren.length; i += 1) {
      this.dragChildren[i].reposition(card.pile, card.position + i);
    }
  }

  public update(): void {
    // Ensure score is within range
    if (this.score < 0) {
      this.score = 0;
    }

    // Win
    const cardsOnFoundation = FOUNDATION_PILES.reduce(
      (acc, pile) => acc + this.deck.countCards(pile),
      0
    );
    if (cardsOnFoundation === 52) {
      this.winText.setVisible(true);
    }

    // Display lives
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  private countMoves(toTableau: boolean): number {
    // Number of empty free cells
    const emptyFreeCells = FREECELL_PILES.reduce(
      (acc, pileId) => acc + (this.deck.isEmpty(pileId) ? 1 : 0),
      0
    );

    // Number of empty tableau piles
    let emptyTableau = TABLEAU_PILES.reduce(
      (acc, pileId) => acc + (this.deck.isEmpty(pileId) ? 1 : 0),
      0
    );

    /*
     * If moving to tableau, we need to subtract 1 from empty tableau
     * because we are moving a card to it
     */
    if (toTableau && emptyTableau > 0) {
      emptyTableau -= 1;
    }

    return 2 ** emptyTableau * (emptyFreeCells + 1);
  }
}
