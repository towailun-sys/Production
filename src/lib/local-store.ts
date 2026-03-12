
import { Player, Game, Attendance } from './types';

const PLAYERS_KEY = 'squadflow_players';
const GAMES_KEY = 'squadflow_games';
const ATTENDANCE_KEY = 'squadflow_attendance';

const defaultPlayers: Player[] = [
  { id: "1", name: "David Miller", nickname: "Miller", email: "david.m@squadflow.com", preferredPositions: ["GK"], teams: ["team-a"], status: "Active" },
  { id: "2", name: "Samuel Jackson", email: "sam.j@squadflow.com", preferredPositions: ["DF", "MF"], teams: ["team-a"], status: "Active" },
  { id: "3", name: "Marcus Rashford", nickname: "Rashy", email: "rashy@squadflow.com", preferredPositions: ["FW"], teams: ["team-b"], status: "Active" },
  { id: "4", name: "Kevin De Bruyne", nickname: "KDB", email: "kdb@squadflow.com", preferredPositions: ["MF"], teams: ["team-a"], status: "Injured" },
  { id: "5", name: "Virgil Van Dijk", nickname: "VVD", email: "vvd@squadflow.com", preferredPositions: ["DF"], teams: ["team-b"], status: "Active" },
  { id: "6", name: "Erling Haaland", nickname: "Terminator", email: "erling@squadflow.com", preferredPositions: ["FW"], teams: ["team-a"], status: "Active" },
  { id: "7", name: "Bukayo Saka", nickname: "Starboy", email: "saka@squadflow.com", preferredPositions: ["FW", "MF"], teams: ["team-b"], status: "Pending for Club Fee" },
  { id: "8", name: "Rodri", email: "rodri@squadflow.com", preferredPositions: ["MF"], teams: ["team-a"], status: "Not Available" },
];

const defaultGames: Game[] = [
  { id: "1", date: "2025-02-10", startTime: "19:00", endTime: "21:00", location: "Central Sports Complex", type: "League", team: "team-a", opponent: "Blue Arrows FC", kitColors: "kit-home-1" },
  { id: "2", date: "2025-02-15", startTime: "18:30", endTime: "20:00", location: "Community Field A", type: "Training", team: "All", kitColors: "kit-home-1" },
  { id: "3", date: "2025-02-22", startTime: "20:00", endTime: "22:00", location: "Stadium Main Pitch", type: "League", team: "team-b", opponent: "Legends United", kitColors: "kit-away-1" },
  { id: "4", date: "2025-02-28", startTime: "19:30", endTime: "21:30", location: "Power League North", type: "Internal", team: "All", opponent: "N/A", kitColors: "kit-away-1" },
];

export const getStoredPlayers = (): Player[] => {
  if (typeof window === 'undefined') return defaultPlayers;
  const stored = localStorage.getItem(PLAYERS_KEY);
  if (!stored) return defaultPlayers;
  
  try {
    const players = JSON.parse(stored) as any[];
    return players.map(p => ({
      ...p,
      preferredPositions: p.preferredPositions || (p.preferredPosition ? [p.preferredPosition] : []),
      teams: p.teams || (p.team ? [p.team] : []),
      status: p.status || "Active"
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
  if (!stored) return defaultGames;
  
  try {
    const games = JSON.parse(stored) as any[];
    return games.map(g => ({
      ...g,
      startTime: g.startTime || g.time || "00:00",
      endTime: g.endTime || g.time || "00:00",
      kitColors: g.kitColors || ""
    }));
  } catch (e) {
    return defaultGames;
  }
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
