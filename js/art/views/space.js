// Widoki zza okna w Kosmosie: 9 kolonii (orbita, L2, Księżyc, Mars, Wenus, Merkury, Ceres, Europa, Tytan).
import { placeholder } from './placeholder.js';

const L = (color, dir, ambient, rim) => ({ color, dir, ambient, rim });
const SPACE = {
  leo: [['#000006', '#040616', '#0a1030'], L([255, 248, 235], [-0.8, -0.6], 0.35, [110, 170, 255])],
  l2: [['#000003', '#020310', '#060a22'], L([255, 245, 230], [-0.6, -0.8], 0.25, [150, 170, 230])],
  moon: [['#000003', '#04050e', '#0c0e20'], L([255, 250, 240], [-0.8, -0.6], 0.3, [140, 180, 255])],
  mars: [['#5c2f22', '#b8694a', '#e3a878'], L([255, 215, 170], [0.8, -0.6], 0.55, [255, 170, 120])],
  venus: [['#6b4b12', '#c99a3a', '#f3d27a'], L([255, 225, 150], [0, -1], 0.75, [255, 210, 120])],
  mercury: [['#000004', '#0a0608', '#1c120c'], L([255, 240, 210], [-0.6, -0.8], 0.4, [255, 200, 150])],
  ceres: [['#000004', '#05050e', '#0f0f22'], L([240, 240, 245], [-0.8, -0.6], 0.25, [170, 180, 210])],
  europa: [['#000006', '#050818', '#0e1330'], L([255, 230, 200], [0.6, -0.8], 0.35, [230, 180, 140])],
  titan: [['#55340f', '#a8692a', '#dda057'], L([255, 190, 110], [0, -1], 0.7, [255, 170, 80])],
};

export const SPACE_RECIPES = Object.fromEntries(Object.entries(SPACE).map(([id, [stops, light]]) => [id, placeholder(id, stops, light)]));
