
import { Player, Game, Attendance } from './types';

const PLAYERS_KEY = 'squadflow_players';
const GAMES_KEY = 'squadflow_games';
const ATTENDANCE_KEY = 'squadflow_attendance';

const defaultPlayers: Player[] = [
  { id: "1", name: "David Miller", nickname: "Miller", preferredPositions: ["GK"], team: "A" },
  { id: "2", name: "Samuel Jackson", preferredPositions: ["DF", "MF"], team: "A" },
  { id: "3", name: "Marcus Rashford", nickname: "Rashy", preferredPositions: ["FW"], team: "B" },
  { id: "4", name: "Kevin De Bruyne", nickname: "KDB", preferredPositions: ["MF"], team: "A" },
  { id: "5", name: "Virgil Van Dijk", nickname: "VVD", preferredPositions: ["DF"], team: "B" },
  { id: "6", name: "Erling Haaland", nickname: "Terminator", preferredPositions: ["FW"], team: "A" },
  { id: "7", name: "Bukayo Saka", nickname: "Starboy", preferredPositions: ["FW", "MF"], team: "B" },
  { id: "8", name: "Rodri", preferredPositions: ["MF"], team: "A" },
];

// Using February 2025 dates for testing the "Current Month" dashboard view
const defaultGames: Game[] = [
  { id: "1", date: "2025-02-10", time: "19:00", location: "Central Sports Complex", type: "League", opponent: "Blue Arrows FC" },
  { id: "2", date: "2025-02-15", time: "18:30", location: "Community Field A", type: "Training" },
  { id: "3", date: "2025-02-22", time: "20:00", location: "Stadium Main Pitch", type: "League", opponent: "Legends United" },
  { id: "4", date: "2025-02-28", time: "19:30", location: "Power League North", type: "Internal" },
  { id: "5", date: "2025-03-05", time: "19:00", location: "Away Grounds", type: "Friendly", opponent: "Old Boys FC" },
];

export const getStoredPlayers = (): Player[] => {
  if (typeof window === 'undefined') return defaultPlayers;
  const stored = localStorage.getItem(PLAYERS_KEY);
  if (!stored) return defaultPlayers;
  
  try {
    const players = JSON.parse(stored) as any[];
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
