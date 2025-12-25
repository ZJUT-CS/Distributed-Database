export const AIRCRAFTS = ['A320', 'A321', 'A330', 'A350', 'B737', 'B777', 'B787'] as const;

export type AircraftModel = typeof AIRCRAFTS[number];
