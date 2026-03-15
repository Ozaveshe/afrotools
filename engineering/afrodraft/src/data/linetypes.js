/**
 * AfroDraft v6 — Linetype Definitions
 *
 * Pattern array convention:
 *   Positive values = dash length (draw)
 *   Negative values = gap length (space)
 *   Values near zero (e.g. 0.5) = dot
 *   Empty array = continuous (solid) line
 *
 * All lengths are in world units (mm at 1:1).
 */

export const LINETYPES = {
  'Continuous': {
    name: 'Continuous',
    description: 'Solid line ________',
    pattern: [],
  },
  'Dashed': {
    name: 'Dashed',
    description: '_ _ _ _ _ _ _ _ _',
    pattern: [12, -6],
  },
  'Hidden': {
    name: 'Hidden',
    description: '_ _ _ _ _ _ _ _',
    pattern: [6, -3],
  },
  'Center': {
    name: 'Center',
    description: '___ _ ___ _ ___ _',
    pattern: [18, -3, 6, -3],
  },
  'Phantom': {
    name: 'Phantom',
    description: '_____ _ _ _____ _ _',
    pattern: [25, -3, 6, -3, 6, -3],
  },
  'Dot': {
    name: 'Dot',
    description: '. . . . . . . .',
    pattern: [0.5, -3],
  },
  'DashDot': {
    name: 'DashDot',
    description: '___ . ___ . ___ .',
    pattern: [12, -3, 0.5, -3],
  },
  'Border': {
    name: 'Border',
    description: '___ ___ . ___ ___ .',
    pattern: [12, -3, 12, -3, 0.5, -3],
  },
  'Divide': {
    name: 'Divide',
    description: '___ . . ___ . .',
    pattern: [12, -3, 0.5, -3, 0.5, -3],
  },
  'Hidden2': {
    name: 'Hidden2',
    description: '_ _ _ _ (half size)',
    pattern: [3, -1.5],
  },
  'Center2': {
    name: 'Center2',
    description: '___ _ ___ (half size)',
    pattern: [9, -1.5, 3, -1.5],
  },
  'Phantom2': {
    name: 'Phantom2',
    description: '_____ _ _ (half size)',
    pattern: [12.5, -1.5, 3, -1.5, 3, -1.5],
  },
  'Dashed2': {
    name: 'Dashed2',
    description: '_ _ _ _ (half size)',
    pattern: [6, -3],
  },
  'DashDot2': {
    name: 'DashDot2',
    description: '___ . ___ (half size)',
    pattern: [6, -1.5, 0.5, -1.5],
  },
  'Fenceline1': {
    name: 'Fenceline1',
    description: '----0----0----0----',
    pattern: [6.35, -2.54, 0, -2.54],
  },
  'Fenceline2': {
    name: 'Fenceline2',
    description: '----X----X----X----',
    pattern: [6.35, -2.54, 6.35, -2.54],
  },
  'Batting': {
    name: 'Batting',
    description: 'Insulation batting',
    pattern: [0.5, -3, 12, -3],
  },
  'Zigzag': {
    name: 'Zigzag',
    description: '/\\/\\/\\/\\/\\/\\/',
    pattern: [3, -3, 3, -3],
  },
};

/**
 * Get a linetype definition by name (case-insensitive).
 * @param {string} name
 * @returns {Object|null}
 */
export function getLinetype(name) {
  return LINETYPES[name] || Object.values(LINETYPES).find(lt => lt.name.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * List all available linetype names.
 * @returns {string[]}
 */
export function listLinetypes() {
  return Object.keys(LINETYPES);
}
