import { getTodayKey } from './date';

export function getPastDateKeys(days = 30) {
  const keys = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(getTodayKey(d));
  }
  return keys;
}