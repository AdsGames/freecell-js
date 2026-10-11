/**
 * Draw order layers. Higher draws on top.
 */
export const DEPTH = {
  /** Resting cards: base + position in pile */
  card: 10,
  /** Cards in flight: base + flight order, so the latest move is on top */
  flight: 1000,
  /** Cards held by the pointer */
  drag: 3000,
  panel: 5000,
  button: 6000,
} as const;

/** Number of flight depth slots before the order wraps */
export const FLIGHT_SLOTS = 1000;
