
export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';
export type TeamType = 'A' | 'B';
export type GameTeamScope = 'A' | 'B' | 'All';
export type PlayerStatus = 'Active' | 'Injured' | 'Not Available' | 'Pending for Club Fee';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  number?: number;
  email?: string;
  preferredPositions: PlayerPosition[];
  team: TeamType;
  status: PlayerStatus;
  isAdmin?: boolean;
}

export type GameType = 'Training' | 'League' | 'Friendly' | 'Internal';

export interface Game {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: GameType;
  team: GameTeamScope;
  opponent?: string;
  kitColors?: string;
}

export type AttendanceStatus = 'Confirmed' | 'Declined' | 'Pending';

export interface Attendance {
  id: string; // matches playerUid
  gameId: string;
  playerId: string;
  status: AttendanceStatus;
  lastUpdated: string;
}
