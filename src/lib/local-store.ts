
import { Player, Game, Attendance } from './types';

const PLAYERS_KEY = 'squadflow_players';
const GAMES_KEY = 'squadflow_games';
const ATTENDANCE_KEY = 'squadflow_attendance';

const defaultPlayers: Player[] = [
  { id: "1", name: "David Miller", nickname: "Miller", preferredPositions: ["GK"] },
  { id: "2", name: "Samuel Jackson", preferredPositions: ["DF", "MF"] },
  { id: "3", name: "Marcus Rashford", nickname: "Rashy", preferredPositions: ["FW"] },
  { id: "4", name: "Kevin De Bruyne", nickname: "KDB", preferredPositions: ["MF"] },
  { id: "5", name: "Virgil Van Dijk", nickname: "VVD", preferredPositions: ["DF"] },
];

const defaultGames: Game[] = [
  { id: "1", date: "2024-06-15", time: "19:00", location: "Central Sports Complex", type: "League", opponent: "Blue Arrows FC" },
  { id: "2", date: "2024-06-20", time: "18:30", location: "Community Field A", type: "Training" },
  { id: "3", date: "2024-06-27", time: "20:00", location: "Stadium Main Pitch", type: "Friendly", opponent: "Legends United" },
];

export const getStoredPlayers = (): Player[] => {
  if (typeof window === 'undefined') return defaultPlayers;
  const stored = localStorage.getItem(PLAYERS_KEY);
  if (!stored) return defaultPlayers;
  
  try {
    const players = JSON.parse(stored) as any[];
    // Migration for existing single position data if any
    return players.map(p => ({
      ...p,
      preferredPositions: p.preferredPositions || (p.preferredPosition ? [p.preferredPosition] : [])
    }));
  } catch (e) {
    return defaultPlayers;
  }
};

export const saveStoredPlayers = (players: Player[]) => {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
};

export const getStoredGames = (): Game[] => {
  if (typeof window === 'undefined') return defaultGames;
  const stored = localStorage.getItem(GAMES_KEY);
  return stored ? JSON.parse(stored) : defaultGames;
};

export const saveStoredGames = (games: Game[]) => {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
};

export const getStoredAttendance = (): Attendance[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ATTENDANCE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveStoredAttendance = (attendance: Attendance[]) => {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
};
