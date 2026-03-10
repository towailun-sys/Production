/**
 * Centralized Dictionaries for UI Strings
 */

const baseDict = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    confirm: "Confirm",
    decline: "Decline",
    join: "Join",
    linked: "Linked",
    team: "Team",
    admin: "Admin",
    captain: "Captain",
    any: "Any",
    tbd: "TBD",
    matchVs: "Match vs",
    training: "Team Training Session",
    internal: "Internal Squad Game",
    status: {
      active: "Active",
      injured: "Injured",
      notAvailable: "Not Available",
      feePending: "Fee Pending"
    },
    positions: {
      gk: "GK",
      df: "DF",
      mf: "MF",
      fw: "FW"
    }
  },
  nav: {
    title: "SquadFlow",
    dashboard: "Dashboard",
    attendance: "My Attendance",
    players: "Players",
    games: "Games",
    signIn: "Sign In",
    signOut: "Log Out",
    language: "Language"
  },
  dashboard: {
    welcome: "Welcome back",
    subtitle: "Your personalized squad overview and upcoming fixtures.",
    seedData: "Seed Data",
    testAsPlayer: "Test as Player",
    claimAdmin: "Claim Admin Rights",
    claimProfileTitle: "We found your profile!",
    claimProfileDesc: (name: string, email: string) => `Hello! An administrator has already created a squad profile for ${name} (${email}).`,
    claimProfileBtn: "Claim Profile",
    pendingProfileTitle: "Profile Pending",
    pendingProfileDesc: "Your account is not yet assigned to a squad. Please provide your User ID to the Team Administrator so they can link your account.",
    copyId: "Copy ID",
    upcomingFixtures: "Upcoming Fixtures",
    fullSchedule: "Full Schedule",
    confirmedSquad: "Confirmed Squad",
    noConfirmations: "No confirmations yet.",
    availability: "Availability",
    manageRoster: "Manage Full Roster",
    viewRoster: "View Squad Roster",
    teammates: "Squad Teammates",
    managePlayers: "Manage All Players",
    viewPlayers: "View Full Squad",
    quickInfo: "Quick Info",
    quickInfoDesc: "Check the squad roster for each game to see who is confirmed. Aim for 11+ players for match days!",
    roles: "TEAM ROLES",
    noGames: "No upcoming games scheduled for your team.",
    myGame: "My Game",
    otherTeam: "Other Team",
    fullAccess: "Full Access View",
    teamView: (team: string) => `Team ${team} View`
  },
  players: {
    title: "Player Management",
    subtitle: "Manage your squad and link Google accounts.",
    addPlayer: "Add Player",
    searchPlaceholder: "Search players...",
    tableHeader: {
      number: "#",
      info: "Player Info",
      team: "Team",
      status: "Status",
      positions: "Positions",
      actions: "Actions"
    },
    dialog: {
      addTitle: "Add New Squad Member",
      editTitle: "Edit Player Profile",
      fullName: "Full Name",
      number: "Squad Number",
      nickname: "Nickname (Display Name)",
      email: "Email Address",
      mobile: "Mobile Number",
      userId: "User ID (Optional)",
      captain: "Team Captain",
      admin: "Administrator",
      preferredPositions: "Preferred Positions",
      save: "Save Player Profile",
      update: "Update Player"
    }
  },
  games: {
    title: "Game Schedule",
    subtitle: "Plan and manage upcoming fixtures.",
    scheduleGame: "Schedule Game",
    dialog: {
      addTitle: "Schedule New Event",
      editTitle: "Edit Event",
      type: "Event Type",
      team: "Assign Team",
      date: "Date",
      start: "Start Time",
      end: "End Time",
      location: "Location",
      opponent: "Opponent",
      kit: "Kit Selection",
      create: "Create Event",
      update: "Save Changes"
    }
  },
  attendance: {
    title: "My Attendance",
    subtitle: "Confirm your availability for upcoming games and training.",
    rosterTitle: "Squad Roster",
    backToSchedule: "Back to Schedule",
    myStatus: "My Status",
    currently: "Currently",
    signinRequired: "Sign in required",
    signinDesc: "Please sign in with your Google account to manage your availability for upcoming team events."
  }
};

const zhDict = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    confirm: "Confirm",
    decline: "Decline",
    join: "Join",
    linked: "Linked",
    team: "Team",
    admin: "Admin",
    captain: "Captain",
    any: "Any",
    tbd: "TBD",
    matchVs: "Match vs",
    training: "Team Training Session",
    internal: "Internal Squad Game",
    status: {
      active: "Active",
      injured: "Injured",
      notAvailable: "Not Available",
      feePending: "Fee Pending"
    },
    positions: {
      gk: "GK",
      df: "DF",
      mf: "MF",
      fw: "FW"
    }
  },
  nav: {
    title: "SquadFlow",
    dashboard: "Dashboard",
    attendance: "我出席的",
    players: "球員",
    games: "場次",
    signIn: "登入",
    signOut: "登出",
    language: "語言"
  },
  dashboard: {
    welcome: "歡迎",
    subtitle: "Your personalized squad overview and upcoming fixtures.",
    seedData: "Seed Data",
    testAsPlayer: "Test as Player",
    claimAdmin: "Claim Admin Rights",
    claimProfileTitle: "We found your profile!",
    claimProfileDesc: (name: string, email: string) => `Hello! An administrator has already created a squad profile for ${name} (${email}).`,
    claimProfileBtn: "Claim Profile",
    pendingProfileTitle: "Profile Pending",
    pendingProfileDesc: "Your account is not yet assigned to a squad. Please provide your User ID to the Team Administrator so they can link your account.",
    copyId: "Copy ID",
    upcomingFixtures: "Upcoming Fixtures",
    fullSchedule: "Full Schedule",
    confirmedSquad: "Confirmed Squad",
    noConfirmations: "No confirmations yet.",
    availability: "Availability",
    manageRoster: "Manage Full Roster",
    viewRoster: "View Squad Roster",
    teammates: "Squad Teammates",
    managePlayers: "Manage All Players",
    viewPlayers: "View Full Squad",
    quickInfo: "Quick Info",
    quickInfoDesc: "Check the squad roster for each game to see who is confirmed. Aim for 11+ players for match days!",
    roles: "TEAM ROLES",
    noGames: "No upcoming games scheduled for your team.",
    myGame: "My Game",
    otherTeam: "Other Team",
    fullAccess: "Full Access View",
    teamView: (team: string) => `Team ${team} View`
  },
  players: {
    title: "Player Management",
    subtitle: "Manage your squad and link Google accounts.",
    addPlayer: "Add Player",
    searchPlaceholder: "Search players...",
    tableHeader: {
      number: "#",
      info: "Player Info",
      team: "Team",
      status: "Status",
      positions: "Positions",
      actions: "Actions"
    },
    dialog: {
      addTitle: "Add New Squad Member",
      editTitle: "Edit Player Profile",
      fullName: "Full Name",
      number: "Squad Number",
      nickname: "Nickname (Display Name)",
      email: "Email Address",
      mobile: "Mobile Number",
      userId: "User ID (Optional)",
      captain: "Team Captain",
      admin: "Administrator",
      preferredPositions: "Preferred Positions",
      save: "Save Player Profile",
      update: "Update Player"
    }
  },
  games: {
    title: "Game Schedule",
    subtitle: "Plan and manage upcoming fixtures.",
    scheduleGame: "Schedule Game",
    dialog: {
      addTitle: "Schedule New Event",
      editTitle: "Edit Event",
      type: "Event Type",
      team: "Assign Team",
      date: "Date",
      start: "Start Time",
      end: "End Time",
      location: "Location",
      opponent: "Opponent",
      kit: "Kit Selection",
      create: "Create Event",
      update: "Save Changes"
    }
  },
  attendance: {
    title: "我出席的",
    subtitle: "Confirm your availability for upcoming games and training.",
    rosterTitle: "Squad Roster",
    backToSchedule: "Back to Schedule",
    myStatus: "My Status",
    currently: "Currently",
    signinRequired: "Sign in required",
    signinDesc: "Please sign in with your Google account to manage your availability for upcoming team events."
  }
};


export type Dictionary = typeof baseDict;

export const en: Dictionary = baseDict;

export const zh: Dictionary = {
  ...zhDict,
  // Temporarily English, to be updated by user later
};
