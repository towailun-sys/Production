"use client";

import { useState } from "react";
import { MainNav } from "@/components/layout/main-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Clock,
  ArrowRight,
  Trophy,
  Lock,
  Loader2,
  ShieldCheck,
  Database,
  UserRound,
  Sparkles,
  Check,
  X,
  Crown,
  Shirt
} from "lucide-react";
import Link from "next/link";
import { Game, Player, Attendance, AttendanceStatus, Team } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, where, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useTranslation } from "@/components/language-provider";

const KIT_COLORS: Record<string, string> = {
  "Home 1: Pink/Grey": "text-pink-500",
  "Home 2: New White / New White": "text-slate-300",
  "Away 1: Black/Black": "text-slate-950",
  "Away 2: White/White": "text-slate-300",
  "TBD": "text-muted-foreground"
};

function UserAttendanceToggle({ gameId, userId }: { gameId: string, userId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { dict } = useTranslation();
  
  const attendanceRef = useMemoFirebase(() => 
    doc(firestore, "games", gameId, "attendanceRecords", userId), 
    [firestore, gameId, userId]
  );
  const { data: attendance } = useDoc<Attendance>(attendanceRef);
  
  const currentStatus = attendance?.status || 'Pending';

  const updateStatus = (status: AttendanceStatus) => {
    const attendanceData = {
      id: userId,
      playerId: userId,
      gameId: gameId,
      status: status,
      lastUpdated: new Date().toISOString()
    };

    setDoc(attendanceRef, attendanceData, { merge: true })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: attendanceRef.path,
          operation: 'write',
          requestResourceData: attendanceData
        } satisfies SecurityRuleContext));
      });

    toast({
      title: status === 'Confirmed' ? "You're in!" : "Status updated",
    });
  };

  return (
    <div className="flex gap-2 w-full mt-4">
      <Button 
        size="sm" 
        variant={currentStatus === 'Confirmed' ? "default" : "outline"}
        className={cn(
          "flex-1 h-10 text-xs font-bold transition-all", 
          currentStatus === 'Confirmed' ? "bg-primary hover:bg-primary/90 border-primary text-white" : "hover:border-primary hover:text-primary"
        )}
        onClick={() => updateStatus('Confirmed')}
      >
        <Check className="h-4 w-4 mr-1.5" /> {dict.common.join}
      </Button>
      <Button 
        size="sm" 
        variant={currentStatus === 'Declined' ? "default" : "outline"}
        className={cn(
          "flex-1 h-10 text-xs font-bold transition-all",
          currentStatus === 'Declined' ? "bg-destructive hover:bg-destructive/90 border-destructive text-white" : "hover:border-destructive hover:text-destructive"
        )}
        onClick={() => updateStatus('Declined')}
      >
        <X className="h-4 w-4 mr-1.5" /> {dict.common.decline}
      </Button>
    </div>
  );
}

function GameAttendancePreview({ gameId, allPlayers, userId }: { gameId: string, allPlayers: Player[], userId: string | undefined }) {
  const firestore = useFirestore();
  const { dict } = useTranslation();
  
  const attendanceQuery = useMemoFirebase(() => {
    if (!userId) return null;
    return collection(firestore, "games", gameId, "attendanceRecords");
  }, [firestore, gameId, userId]);
  
  const { data: attendanceDocs, isLoading } = useCollection<Attendance>(attendanceQuery);

  if (isLoading) return <div className="h-4 w-24 animate-pulse bg-muted rounded mt-2" />;
  
  const confirmedPlayers = attendanceDocs
    ?.filter(a => a.status === 'Confirmed')
    .map(a => allPlayers.find(p => p.id === a.playerId))
    .filter(Boolean) as Player[] || [];

  if (confirmedPlayers.length === 0) {
    return <div className="text-[11px] text-muted-foreground italic mt-3">{dict.dashboard.noConfirmations}</div>;
  }

  return (
    <div className="mt-4 pt-3 border-t border-dashed">
      <div className="flex items-center gap-1.5 mb-2">
        <Check className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{dict.dashboard.confirmedSquad} ({confirmedPlayers.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {confirmedPlayers.map((p) => (
          <Badge 
            key={p.id} 
            variant="secondary" 
            className="text-[10px] py-0.5 px-2 h-6 font-bold gap-1 bg-primary/10 text-primary border-primary/20"
          >
            {p.isCaptain && <Crown className="h-3 w-3 text-accent" />}
            {p.number && <span className="mr-0.5 opacity-60">#{p.number}</span>}
            {p.nickname || p.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { language, dict } = useTranslation();
  
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClaimingAdmin, setIsClaimingAdmin] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const playerRef = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user, isUserLoading]);
  const { data: currentPlayer, isLoading: isProfileLoading } = useDoc<Player>(playerRef);

  const emailMatchQuery = useMemoFirebase(() => {
    if (isUserLoading || !user || currentPlayer) return null;
    return query(collection(firestore, "players"), where("email", "==", user.email), limit(1));
  }, [firestore, user, currentPlayer, isUserLoading]);
  const { data: matchedProfiles } = useCollection<Player>(emailMatchQuery);
  const preEnteredProfile = matchedProfiles?.find(p => p.id !== user?.uid);

  const teamsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "teams");
  }, [firestore, user, isUserLoading]);
  const { data: teams } = useCollection<Team>(teamsQuery);

  const gamesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    const now = new Date().toISOString().split('T')[0];
    
    return query(
      collection(firestore, "games"),
      where("date", ">=", now),
      orderBy("date", "asc"),
      limit(15)
    );
  }, [firestore, user, isUserLoading]);

  const { data: upcomingGames, isLoading: isGamesLoading } = useCollection<Game>(gamesQuery);
  
  const playersQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "players");
  }, [firestore, user, isUserLoading]);
  
  const { data: players } = useCollection<Player>(playersQuery);

  const handleClaimProfile = () => {
    if (!user || !preEnteredProfile) return;
    setIsLinking(true);
    
    const newDocRef = doc(firestore, "players", user.uid);
    const claimData = {
      ...preEnteredProfile,
      id: user.uid,
      email: user.email,
      isLinked: true 
    };

    setDoc(newDocRef, claimData)
      .then(() => {
        const oldDocRef = doc(firestore, "players", preEnteredProfile.id);
        deleteDoc(oldDocRef);
        toast({ title: "Profile Claimed!" });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: newDocRef.path,
          operation: 'create',
          requestResourceData: claimData
        } satisfies SecurityRuleContext));
      })
      .finally(() => {
        setIsLinking(false);
      });
  };

  const handleClaimAdmin = () => {
    if (!user) return;
    setIsClaimingAdmin(true);
    
    const adminRef = doc(firestore, "players", user.uid);
    
    const adminData: Partial<Player> = {
      id: user.uid,
      isAdmin: true,
      isLinked: true
    };

    if (!currentPlayer) {
      Object.assign(adminData, {
        name: user.displayName || "Admin User",
        email: user.email || "",
        status: "Active",
        teams: [],
        preferredPositions: ["MF", "FW"],
        number: 10
      });
    }

    setDoc(adminRef, adminData, { merge: true })
      .then(() => {
        toast({ title: "Admin Rights Granted" });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: adminRef.path,
          operation: 'write',
          requestResourceData: adminData
        } satisfies SecurityRuleContext));
      })
      .finally(() => {
        setIsClaimingAdmin(false);
      });
  };

  const handleToggleAdminRole = () => {
    if (!user || !currentPlayer) return;
    const newAdminStatus = !currentPlayer.isAdmin;
    const playerRef = doc(firestore, "players", user.uid);
    setDoc(playerRef, { id: user.uid, isAdmin: newAdminStatus }, { merge: true });
    toast({ title: newAdminStatus ? "Admin Mode" : "Player Mode" });
  };

  const handleSeedData = () => {
    if (!user || !currentPlayer?.isAdmin) return;
    setIsSeeding(true);
    
    const sampleTeams = [
      { id: "team-a", name: "Team A", nameZh: "隊伍A" },
      { id: "team-b", name: "Team B", nameZh: "隊伍B" },
      { id: "team-camp3", name: "Team Camp 3", nameZh: "訓練營 3" }
    ];

    sampleTeams.forEach(t => {
      setDoc(doc(firestore, "teams", t.id), t);
    });

    const today = new Date().toISOString().split('T')[0];
    const in3Days = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
    const in10Days = new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0];

    const sampleGames = [
      { id: "seed-g1", date: today, startTime: "19:00", endTime: "21:00", location: "Central Sports Complex", type: "League", team: "team-a", opponent: "Blue Arrows FC", coach: "Sir Alex", kitColors: "Home 1: Pink/Grey", additionalDetails: "Please arrive 30 mins early for warm up." },
      { id: "seed-g2", date: in3Days, startTime: "18:30", endTime: "20:00", location: "Community Field A", type: "Training", team: "All", opponent: "N/A", coach: "Pep G", kitColors: "Home 2: New White / New White", additionalDetails: "Tactics session." },
      { id: "seed-g3", date: in7Days, startTime: "20:00", endTime: "22:00", location: "South Pitch 4", type: "Friendly", team: "team-b", opponent: "Red Devils", coach: "Klopp", kitColors: "Away 1: Black/Black", additionalDetails: "Friendly against rivals." },
      { id: "seed-g4", date: in10Days, startTime: "19:00", endTime: "21:00", location: "Camp 3 Training Ground", type: "Internal", team: "team-camp3", opponent: "N/A", coach: "Mou", kitColors: "Away 2: White/White", additionalDetails: "Internal practice match." },
    ];

    sampleGames.forEach(g => {
      setDoc(doc(firestore, "games", g.id), g);
    });

    const playerRef = doc(firestore, "players", user.uid);
    setDoc(playerRef, { 
      id: user.uid,
      teams: ["team-a", "team-b", "team-camp3"],
      status: "Active",
      number: currentPlayer?.number || 10
    }, { merge: true });

    toast({ title: "Seeding Complete", description: "Sample teams and games created. You are now assigned to all teams." });
    setIsSeeding(false);
  };

  const formatGameDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'zh') {
      const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
    }
    return date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getTeamName = (teamId: string) => {
    if (teamId === 'All') return dict.common.teams.All;
    const team = teams?.find(t => t.id === teamId);
    if (!team) return teamId;
    return language === 'zh' ? team.nameZh : team.name;
  };

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="min-h-screen bg-background pb-12 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <div className="text-muted-foreground font-medium">{dict.common.loading}</div>
      </div>
    );
  }

  const welcomeName = currentPlayer?.nickname || currentPlayer?.name || user?.displayName || "Player";
  const filteredGames = upcomingGames?.filter(game => {
    if (currentPlayer?.isAdmin) return true;
    if (!currentPlayer) return false;
    return game.team === 'All' || currentPlayer.teams?.includes(game.team);
  }) || [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-headline tracking-tight">
              {user ? (language === 'zh' ? `${dict.dashboard.welcome}，${welcomeName}！` : `${dict.dashboard.welcome}, ${welcomeName}!`) : dict.nav.dashboard}
            </h1>
            <div className="text-muted-foreground font-medium text-sm md:text-base">{dict.dashboard.subtitle}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentPlayer?.isAdmin && (
              <>
                <Button variant="outline" size="sm" className="border-dashed border-primary text-primary hover:bg-primary/5 font-bold text-xs" onClick={handleSeedData}>
                  <Database className="mr-2 h-3.5 w-3.5" /> {dict.dashboard.seedData}
                </Button>
                <Button variant="outline" size="sm" className="border-dashed border-destructive text-destructive hover:bg-destructive/5 font-bold text-xs" onClick={handleToggleAdminRole}>
                  <UserRound className="mr-2 h-3.5 w-3.5" /> {dict.dashboard.testAsPlayer}
                </Button>
              </>
            )}
            {user && (!currentPlayer || !currentPlayer.isAdmin) && (
              <Button variant="outline" size="sm" className="border-dashed border-primary text-primary hover:bg-primary/5 font-bold text-xs" onClick={handleClaimAdmin}>
                <ShieldCheck className="mr-2 h-3.5 w-3.5" /> {dict.dashboard.claimAdmin}
              </Button>
            )}
          </div>
        </header>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-muted/20 rounded-3xl border border-dashed border-primary/20">
            <Lock className="h-10 w-10 text-primary mb-4" />
            <h2 className="text-xl md:text-2xl font-headline mb-2">{dict.attendance.signinRequired}</h2>
            <div className="text-muted-foreground text-sm max-w-sm">{dict.attendance.signinDesc}</div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-8">
              {!currentPlayer && preEnteredProfile && (
                <Card className="border-primary border-2 bg-primary/5 shadow-xl">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-primary text-lg md:text-xl"><Sparkles className="h-5 w-5 md:h-6 md:w-6" />{dict.dashboard.claimProfileTitle}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-foreground text-sm md:text-base font-medium">{dict.dashboard.claimProfileDesc(preEnteredProfile.name, preEnteredProfile.email || "")}</div>
                    <div className="p-4 bg-white rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold">{preEnteredProfile.name}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {preEnteredProfile.teams?.map(tId => (
                            <Badge key={tId} variant="outline" className="text-[10px] py-0 px-2 h-5">{getTeamName(tId)}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button onClick={handleClaimProfile} disabled={isLinking} className="bg-primary hover:bg-primary/90 gap-2 font-bold w-full sm:w-auto">{dict.dashboard.claimProfileBtn}</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                  <h2 className="text-xl md:text-2xl font-headline flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />{dict.nav.dashboard}
                    {currentPlayer && (
                      <Badge variant="outline" className="hidden sm:inline-flex ml-2 bg-primary/10 text-primary border-primary/20 font-bold">
                        {currentPlayer.isAdmin ? dict.dashboard.fullAccess : dict.dashboard.teamView(currentPlayer.teams?.map(getTeamName).join(', ') || "No Team")}
                      </Badge>
                    )}
                  </h2>
                  <Link href="/games"><Button variant="ghost" size="sm" className="text-primary gap-1 font-bold p-0 sm:px-3 sm:py-2 hover:bg-transparent sm:hover:bg-muted/50">{dict.dashboard.fullSchedule} <ArrowRight className="h-4 w-4" /></Button></Link>
                </div>

                <div className="grid gap-6">
                  {isGamesLoading ? <Loader2 className="animate-spin" /> : filteredGames.length === 0 ? <Card className="p-12 text-center border-dashed border-2 text-muted-foreground">{dict.dashboard.noGames}</Card> : (
                    filteredGames.map((game) => (
                      <Card key={game.id} className="border-none shadow-md overflow-hidden border-l-4 border-primary transition-all active:scale-[0.98] sm:active:scale-100">
                        <CardContent className="p-0 flex flex-col md:flex-row">
                          <div className="p-5 md:p-6 flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <Badge className="text-[10px] md:text-xs font-bold bg-primary text-white px-3 py-0.5 border-none">{getTeamName(game.team)}</Badge>
                              <span className="text-xs md:text-sm font-bold text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{game.startTime} - {game.endTime}</span>
                              {game.coach && (
                                <span className="text-[10px] md:text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                  <UserRound className="h-3.5 w-3.5 text-primary" />
                                  {game.coach}
                                </span>
                              )}
                              {game.kitColors && (
                                <span className={cn("text-[10px] md:text-xs font-bold flex items-center gap-1.5", KIT_COLORS[game.kitColors] || "text-muted-foreground")}>
                                  <Shirt className="h-3.5 w-3.5" />
                                  {dict.common.kits[game.kitColors as keyof typeof dict.common.kits] || game.kitColors}
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg md:text-xl font-headline mb-4 leading-tight">
                              {game.type === 'Training' || game.type === 'Internal' ? dict.common.gameTypes[game.type] : `${dict.common.matchVs} ${game.opponent || dict.common.tbd}`}
                            </h3>
                            <div className="grid gap-2.5 text-xs md:text-sm text-muted-foreground">
                              <div className="flex items-center gap-2.5"><Calendar className="h-4 w-4 text-primary shrink-0" />{formatGameDate(game.date)}</div>
                              <div className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-primary shrink-0" />{game.location}</div>
                            </div>
                            <GameAttendancePreview gameId={game.id} allPlayers={players || []} userId={user?.uid} />
                          </div>
                          <div className="bg-muted/30 p-5 md:p-6 md:w-80 border-t md:border-t-0 md:border-l flex flex-col justify-between gap-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{dict.attendance.attendingQuestion}</p>
                              <UserAttendanceToggle gameId={game.id} userId={user.uid} />
                            </div>
                            <Link href={`/attendance?gameId=${game.id}`} className="mt-2 sm:mt-0"><Button variant="outline" size="sm" className="w-full text-xs font-bold border-primary text-primary hover:bg-primary hover:text-white gap-2 h-10 md:h-9">{dict.dashboard.viewRoster}</Button></Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8 lg:sticky lg:top-24 h-fit">
              <Card className="border-primary/10 shadow-lg bg-primary/5">
                <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />{dict.dashboard.teammates}</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="divide-y max-h-[300px] lg:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {players?.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px] border border-primary/10">{p.number || p.name[0]}</div>
                        <div className="flex-1 text-xs font-bold truncate text-foreground/90">{p.nickname || p.name}</div>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
                          {p.teams?.map(tId => (
                            <Badge key={tId} variant="outline" className="text-[8px] h-4 px-1 bg-primary text-white border-none whitespace-nowrap">{getTeamName(tId)}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/players"><Button className="w-full bg-primary font-bold h-10">{dict.dashboard.viewPlayers}</Button></Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}