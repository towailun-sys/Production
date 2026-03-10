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
    teams: {
      A: "Team A",
      B: "Team B",
      All: "For all Team"
    },
    admin: "Admin",
    captain: "Captain",
    any: "Any",
    tbd: "TBD",
    matchVs: "Match vs",
    training: "Team Training Session",
    internal: "Internal Squad Game",
    status: "Status",
    statusLabel: "Status",
    statusTypes: {
      active: "Active",
      injured: "Injured",
      notAvailable: "Not Available",
      feePending: "Fee Pending"
    },
    gameTypes: {
      Training: "Training",
      League: "League Match",
      Friendly: "Friendly Match",
      Internal: "Internal Game"
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

const zhDict: typeof baseDict = {
  common: {
    save: "儲存",
    cancel: "取消",
    delete: "刪除",
    edit: "編輯",
    loading: "載入中...",
    confirm: "確認",
    decline: "不能出席",
    join: "出席",
    linked: "已連結",
    team: "隊伍",
    teams: {
      A: "隊伍A",
      B: "隊伍B",
      All: "全部隊伍"
    },
    admin: "管理員",
    captain: "隊長",
    any: "不限",
    tbd: "有待決定",
    matchVs: "比賽對手",
    training: "球隊訓練",
    internal: "內部比賽",
    status: "狀態",
    statusLabel: "狀態",
    statusTypes: {
      active: "現役",
      injured: "受傷",
      notAvailable: "退役/離隊",
      feePending: "有欠款"
    },
    gameTypes: {
      Training: "訓練",
      League: "聯賽",
      Friendly: "友誼賽",
      Internal: "內部賽"
    },
    positions: {
      gk: "龍門",
      df: "後衛",
      mf: "中場",
      fw: "前鋒"
    }
  },
  nav: {
    title: "SquadFlow",
    dashboard: "概覽",
    attendance: "我出席的",
    players: "球員",
    games: "場次",
    signIn: "登入",
    signOut: "登出",
    language: "語言"
  },
  dashboard: {
    welcome: "歡迎",
    subtitle: "最近可供出席的場次",
    seedData: "植入測試數據",
    testAsPlayer: "以球員身份測試",
    claimAdmin: "索取管理員權限",
    claimProfileTitle: "我們找到了你的個人資料！",
    claimProfileDesc: (name: string, email: string) => `你好！管理員已經為 ${name} (${email}) 創建了球員資料。`,
    claimProfileBtn: "認領資料",
    pendingProfileTitle: "資料待處理",
    pendingProfileDesc: "你的帳號尚未分配到任何球隊。請將你的用戶 ID 提供給球隊管理員，以便他們連結你的帳號。",
    copyId: "複製 ID",
    upcomingFixtures: "賽程",
    fullSchedule: "全部場次",
    confirmedSquad: "已確認出席的陣容",
    noConfirmations: "尚未確認",
    availability: "出席情況",
    manageRoster: "管理名單",
    viewRoster: "查看名單",
    teammates: "隊友",
    managePlayers: "管理球員",
    viewPlayers: "全隊陣容",
    quickInfo: "快速資訊",
    quickInfoDesc: "查看每場比賽的球員名單以確認出席人數。比賽日目標為 11 人以上！",
    roles: "球隊角色",
    noGames: "你的隊伍目前沒有預定的比賽。",
    myGame: "我的比賽",
    otherTeam: "其他隊伍",
    fullAccess: "管理員全視角",
    teamView: (team: string) => `${team} 隊視角`
  },
  players: {
    title: "球員管理",
    subtitle: "管理球員名單並連結 Google 帳號。",
    addPlayer: "新增球員",
    searchPlaceholder: "搜尋球員...",
    tableHeader: {
      number: "#",
      info: "球員資料",
      team: "隊伍",
      status: "狀態",
      positions: "位置",
      actions: "動作"
    },
    dialog: {
      addTitle: "新增球員",
      editTitle: "編輯球員資料",
      fullName: "全名",
      number: "球衣號碼",
      nickname: "暱稱 (顯示名稱)",
      email: "電郵地址",
      mobile: "流動電話",
      userId: "用戶 ID (選填)",
      captain: "隊長",
      admin: "管理員",
      preferredPositions: "偏好位置",
      save: "儲存球員資料",
      update: "更新球員"
    }
  },
  games: {
    title: "賽程表",
    subtitle: "規劃並管理即將舉行的賽事。",
    scheduleGame: "安排比賽",
    dialog: {
      addTitle: "安排新活動",
      editTitle: "編輯活動",
      type: "活動類型",
      team: "分配隊伍",
      date: "日期",
      start: "開始時間",
      end: "結束時間",
      location: "地點",
      opponent: "對手",
      kit: "球衣顏色",
      create: "創建活動",
      update: "儲存更改"
    }
  },
  attendance: {
    title: "我出席的",
    subtitle: "確認你出席即將舉行的比賽和訓練。",
    rosterTitle: "球員名單",
    backToSchedule: "返回賽程",
    myStatus: "我的狀態",
    currently: "目前",
    signinRequired: "請先登入",
    signinDesc: "請使用你的 Google 帳號登入，以管理你出席球隊活動的情況。"
  }
};


export type Dictionary = typeof baseDict;

export const en: Dictionary = baseDict;

export const zh: Dictionary = zhDict;
