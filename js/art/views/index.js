// Rejestr wszystkich 45 widoków zza okna (biura, kolonie, układy, galaktyki) i walidacja klucza światła.
// Klucz światła mówi dioramie, jak ją oświetlić: kolor i kierunek światła, światło otoczenia i obrys.
import { EARTH_RECIPES } from './earth.js';
import { SPACE_RECIPES } from './space.js';
import { GALAXY_RECIPES } from './galaxy.js';
import { UNIVERSE_RECIPES } from './universe.js';

export const RECIPES = { ...EARTH_RECIPES, ...SPACE_RECIPES, ...GALAXY_RECIPES, ...UNIVERSE_RECIPES };
export const VIEW_IDS = Object.keys(RECIPES);
const FALLBACK = 'waw';

export function recipeFor(id) { return RECIPES[id] || RECIPES[FALLBACK]; }

const rgbOk = (c) => Array.isArray(c) && c.length === 3 && c.every((v) => Number.isInteger(v) && v >= 0 && v <= 255);
export function validLight(k) {
  if (!k || !rgbOk(k.color) || !rgbOk(k.rim)) return false;
  if (!Array.isArray(k.dir) || k.dir.length !== 2 || Math.abs(Math.hypot(k.dir[0], k.dir[1]) - 1) > 0.02) return false;
  return typeof k.ambient === 'number' && k.ambient >= 0 && k.ambient <= 1;
}
