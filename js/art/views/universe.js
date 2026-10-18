// Widoki z cytadeli we Wszechświecie: galaktyki, gromady i kraniec obserwowalnego kosmosu.
import { placeholder } from './placeholder.js';

const L = (color, dir, ambient, rim) => ({ color, dir, ambient, rim });
const UNIVERSE = {
  milkyway: [['#000003', '#04030f', '#0b0820'], L([240, 235, 250], [0, -1], 0.35, [210, 210, 255])],
  andromeda: [['#010208', '#050a1e', '#0d1636'], L([225, 232, 255], [-0.6, -0.8], 0.35, [180, 200, 255])],
  triangulum: [['#020206', '#08081a', '#121230'], L([255, 190, 220], [0.6, -0.8], 0.35, [255, 150, 200])],
  virgo: [['#040302', '#100c08', '#221a10'], L([255, 220, 160], [0, -1], 0.4, [255, 200, 130])],
  bullet: [['#060208', '#14061c', '#260c30'], L([235, 140, 230], [0.6, -0.8], 0.4, [120, 170, 255])],
  attractor: [['#020408', '#061020', '#0c1e38'], L([255, 245, 230], [0, -1], 0.4, [200, 220, 255])],
  bootes: [['#000000', '#010101', '#030306'], L([200, 200, 215], [0, -1], 0.15, [120, 120, 150])],
  hercules: [['#030104', '#0e0612', '#1c0c22'], L([200, 170, 255], [0, -1], 0.4, [170, 140, 255])],
  edge: [['#1a0a04', '#3a1608', '#5a2a10'], L([255, 170, 100], [0, -1], 0.5, [255, 140, 80])],
};

export const UNIVERSE_RECIPES = Object.fromEntries(Object.entries(UNIVERSE).map(([id, [stops, light]]) => [id, placeholder(id, stops, light)]));
