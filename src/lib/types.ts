
export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';
export type PlayerStatus = 'Active' | 'Injured' | 'Not Available' | 'Pending for Club Fee';

export interface Team {
  id: string;
  name: string;
  nameZh: string;
}

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  number?: number;
  email?: string;
  mobileNumber?: string;
  preferredPositions: PlayerPosition[];
  teams: string[]; // References Team.id
  status: PlayerStatus;
  isAdmin?: boolean;
  isCaptain?: boolean;
  isLinked?: boolean;
}

export type GameType = 'Training' | 'League' | 'Friendly' | 'Internal';

export interface Game {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: GameType;
  team: string; // References Team.id or 'All'
  opponent?: string;
  kitColors?: string;
  alternativeKitColors?: string;
  coach?: string;
  fee?: string;
  additionalDetails?: string;
}

export type AttendanceStatus = 'Confirmed' | 'Declined' | 'Pending';

export interface Attendance {
  id: string; // matches playerUid
  gameId: string;
  playerId: string;
  status: AttendanceStatus;
  lastUpdated: string;
}
