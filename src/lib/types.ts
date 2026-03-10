
export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  preferredPosition: PlayerPosition;
}

export type GameType = 'Training' | 'League' | 'Friendly' | 'Internal';

export interface Game {
  id: string;
  date: string;
  time: string;
  location: string;
  type: GameType;
  opponent?: string;
}

export type AttendanceStatus = 'Confirmed' | 'Declined' | 'Pending';

export interface Attendance {
  gameId: string;
  playerId: string;
  status: AttendanceStatus;
}
