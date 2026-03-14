
export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';
export type PlayerStatus = 'Active' | 'Injured' | 'Not Available' | 'Pending for Club Fee' | 'Trial';

export interface Team {
  id: string;
  name: string;
  nameZh: string;
}

export interface Kit {
  id: string;
  name: string;
  nameZh?: string;
  color?: string;
  colorZh?: string;
  imageUrl: string;
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
  kitColors?: string; // References Kit.id
  alternativeKitColors?: string; // References Kit.id
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
  isGuest?: boolean;
  guestName?: string;
}
