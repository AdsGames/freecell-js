import * as Phaser from "phaser";

import Card from "./card";
import Deck, { type Move, type Piles } from "./deck";
import { STACK_DRAG_OFFSET } from "./constants/deck";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "./constants/screen";
import { ALL_PILES, type PileId, TABLE_LEFT } from "./constants/table";
import { MAX_DEAL, MIN_DEAL, isValidDeal, randomDeal } from "./deal";
import { Pile } from "./pile";
import { type Stats, recordLoss, recordWin } from "./stats";
import {
  BUTTON_GAP,
  Panel,
  cascade,
  createButton,
  createStatusText,
} from "./ui";

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  key: "GameState",
  visible: false,
};

const DOUBLE_CLICK_MS = 350;
const DRAG_THRESHOLD = 4;

interface HistoryEntry {
  piles: Piles;
  moves: number;
}

const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

const dealFromHash = (): number | null => {
  const n = Number(window.location.hash.slice(1));
  return isValidDeal(n) ? n : null;
};

export default class GameState extends Phaser.Scene {
  private deck!: Deck;

  private dealNumber = 0;

  private moves = 0;

  private startTime: number | null = null;

  private finalTime = 0;

  private won = false;

  private history: HistoryEntry[] = [];

  private dragChildren: Card[] = [];

  private lastClick: { card: Card; time: number } | null = null;

  private statusText!: Phaser.GameObjects.Text;

  private dealLabel!: Phaser.GameObjects.Text;

  private panel!: Panel;

  public constructor() {
    super(sceneConfig);
  }

  public create(): void {
    this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "img_background");

    ALL_PILES.forEach((pileId) => {
      this.add.existing(new Pile(this, pileId));
    });

    this.deck = new Deck(this);
    this.panel = new Panel(this);

    this.createInputListeners();
    this.createButtons();

    this.statusText = createStatusText(this);

    this.startDeal(dealFromHash() ?? randomDeal());
  }

  public update(): void {
    this.statusText.setText(
      `MOVES:${this.moves} ${formatTime(this.elapsed())}`
    );
  }

  private createInputListeners(): void {
    this.input.dragDistanceThreshold = DRAG_THRESHOLD;

    this.input.on(
      "dragstart",
      (_pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        if (obj instanceof Card) {
          this.dragCardStart(obj);
        }
      }
    );

    this.input.on(
      "drag",
      (
        _pointer: Phaser.Input.Pointer,
        obj: Phaser.GameObjects.GameObject,
        dragX: number,
        dragY: number
      ) => {
        if (obj instanceof Card) {
          this.dragCard(dragX, dragY);
        }
      }
    );

    this.input.on(
      "drop",
      (
        _pointer: Phaser.Input.Pointer,
        obj: Phaser.GameObjects.GameObject,
        zone: Phaser.GameObjects.GameObject
      ) => {
        if (obj instanceof Card && zone instanceof Pile) {
          this.dropCards(zone.pileId);
        }
      }
    );

    this.input.on(
      "dragend",
      (_pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        if (obj instanceof Card) {
          this.dragCardEnd();
        }
      }
    );

    // A tap is a press and release without moving far enough to drag
    this.input.on(
      "gameobjectup",
      (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        if (obj instanceof Card && pointer.getDistance() < DRAG_THRESHOLD) {
          this.tapCard(obj, pointer);
        }
      }
    );
  }

  private createButtons(): void {
    const buttons: [string, () => void][] = [
      [
        "Redeal",
        () => {
          this.startDeal(this.dealNumber);
        },
      ],
      [
        "New Deal",
        () => {
          this.startDeal(randomDeal());
        },
      ],
      [
        "#1000000",
        () => {
          this.selectDeal();
        },
      ],
      [
        "Undo",
        () => {
          this.undo();
        },
      ],
    ];

    let x = TABLE_LEFT;
    buttons.forEach(([label, onClick], i) => {
      const button = createButton(this, x, label, onClick);
      if (i === 2) {
        this.dealLabel = button.label;
      }
      x += button.width + BUTTON_GAP;
    });
  }

  private selectDeal(): void {
    const answer = window.prompt(
      `Deal number (${MIN_DEAL}-${MAX_DEAL})`,
      String(this.dealNumber)
    );
    if (answer === null) {
      return;
    }

    const n = Number(answer.trim());
    if (isValidDeal(n)) {
      this.startDeal(n);
    }
  }

  private startDeal(dealNumber: number): void {
    // Leaving a game in progress counts as a loss
    if (this.moves > 0 && !this.won) {
      recordLoss();
    }

    this.dealNumber = dealNumber;
    this.dealLabel.setText(`#${dealNumber}`);
    window.history.replaceState(null, "", `#${dealNumber}`);

    this.moves = 0;
    this.startTime = null;
    this.finalTime = 0;
    this.won = false;
    this.history = [];
    this.dragChildren = [];
    this.panel.hide();

    this.deck.deal(dealNumber);
    this.deck.layoutAll(false);
    this.afterMove();
  }

  private dragCardStart(card: Card): void {
    this.dragChildren = [];
    if (this.won) {
      return;
    }

    const cards = this.deck.pickUp(card);
    if (!cards || cards.length > this.deck.maxMovable(false)) {
      card.flash();
      return;
    }

    this.dragChildren = cards;
    cards.forEach((c, i) => {
      c.lift(i);
    });
  }

  private dragCard(dragX: number, dragY: number): void {
    this.dragChildren.forEach((card, i) => {
      card.setPosition(dragX, dragY + i * STACK_DRAG_OFFSET);
    });
  }

  private dropCards(to: PileId): void {
    if (this.dragChildren.length === 0) {
      return;
    }

    if (this.deck.canMove(this.dragChildren, to)) {
      this.commitMove(this.dragChildren, to);
    } else if (this.deck.pileOf(this.dragChildren[0]) !== to) {
      this.dragChildren.forEach((card) => {
        card.flash();
      });
    }
  }

  private dragCardEnd(): void {
    // Settle dragged cards wherever they now belong. A rejected drop returns.
    if (this.dragChildren.length > 0) {
      this.deck.layout(this.deck.pileOf(this.dragChildren[0]), true);
    }
    this.dragChildren = [];
  }

  /**
   * A touch tap moves the card at once. A mouse needs a double-click, so a
   * single click can still start a drag without moving anything.
   */
  private tapCard(card: Card, pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch) {
      const isDouble =
        this.lastClick?.card === card &&
        pointer.upTime - this.lastClick.time < DOUBLE_CLICK_MS;
      this.lastClick = isDouble ? null : { card, time: pointer.upTime };
      if (!isDouble) {
        return;
      }
    }

    if (this.won) {
      return;
    }

    const move = this.deck.quickMove(card);
    if (move === null) {
      card.flash();
    } else {
      this.commitMove(move.cards, move.to);
    }
  }

  private commitMove(cards: readonly Card[], to: PileId): void {
    this.history.push({ piles: this.deck.snapshot(), moves: this.moves });
    this.startTime ??= this.time.now;
    this.moves += 1;

    this.layoutMove(this.deck.move(cards, to));
    this.afterMove();
  }

  private layoutMove({ from, to }: Move): void {
    this.deck.layout(from, true);
    this.deck.layout(to, true);
  }

  /**
   * Play safe cards to the foundations, then check for a win or a dead end.
   */
  private afterMove(): void {
    let next = this.deck.nextAutoMove();
    while (next) {
      this.layoutMove(this.deck.move([next.card], next.to));
      next = this.deck.nextAutoMove();
    }

    if (this.deck.isWon()) {
      this.win();
    } else if (!this.deck.hasMoves()) {
      this.panel.show("NO MOVES LEFT", ["Undo, Redeal or", "start a New Deal"]);
    }
  }

  private undo(): void {
    const entry = this.history.pop();
    if (!entry || this.won) {
      return;
    }

    this.deck.restore(entry.piles);
    this.moves = entry.moves;
    this.panel.hide();
    this.deck.layoutAll(true);
  }

  private elapsed(): number {
    if (this.won) {
      return this.finalTime;
    }
    return this.startTime === null ? 0 : this.time.now - this.startTime;
  }

  private win(): void {
    this.finalTime = this.elapsed();
    this.won = true;

    this.showWinPanel(recordWin());
    cascade(this, this.deck.cards);
  }

  private showWinPanel(stats: Stats): void {
    this.panel.show("YOU WIN!", [
      `MOVES ${this.moves}  TIME ${formatTime(this.finalTime)}`,
      `WINS ${stats.wins}  LOSSES ${stats.losses}`,
      `STREAK ${stats.streak}  BEST ${stats.bestStreak}`,
    ]);
  }
}
