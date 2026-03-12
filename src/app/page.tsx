"use client";

import { useState } from "react";
import { MainNav } from "@/components/layout/main-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Shirt,
  Banknote,
  Info,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { Game, Player, Attendance, AttendanceStatus, Team, Kit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, where, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useTranslation } from "@/components/language-provider";
import Image from "next/image";

function KitBadge({ kitId, isAlternative = false }: { kitId: string, isAlternative?: boolean }) {
  const firestore = useFirestore();
  const { dict, language } = useTranslation();
  
  const kitRef = useMemoFirebase(() => {
    if (!kitId || kitId.includes('/')) return null;
    return doc(firestore, "kits", kitId);
  }, [firestore, kitId]);
  
  const { data: kit, isLoading } = useDoc<Kit>(kitRef);

  if (isLoading) return <div className="h-4 w-16 animate-pulse bg-muted rounded" />;
  
  if (!kit) {
    if (kitId && kitId.length > 0) {
      return (
        <Badge 
          variant="outline" 
          className="text-[10px] md:text-xs font-bold flex items-center gap-1.5 opacity-60 py-1"
        >
          <Shirt className="h-3.5 w-3.5" />
          {isAlternative && <span className="text-[9px] uppercase tracking-wider mr-1 opacity-70">ALT:</span>}
          {kitId}
        </Badge>
      );
    }
    return <span className="text-[10px] font-bold text-muted-foreground">{dict.common.tbd}</span>;
  }

  const kitName = language === 'zh' ? kit.nameZh || kit.name : kit.name;
  const kitColor = language === 'zh' ? kit.colorZh || kit.color : kit.color;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] md:text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 transition-colors py-1", 
            "text-primary border-primary/30"
          )}
        >
          <Shirt className="h-3.5 w-3.5" />
          {isAlternative && <span className="text-[9px] uppercase tracking-wider mr-1 opacity-70">ALT:</span>}
          {kitName}
          {kitColor && <span className="opacity-80 font-normal ml-1">({kitColor})</span>}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 shadow-xl rounded-xl">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{dict.players.kits.viewImage}</span>
            </div>
            <Badge variant="outline" className="text-[9px] font-bold">{kitName}</Badge>
          </div>
          <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden border bg-muted">
            {kit.imageUrl ? (
              <Image 
                src={kit.imageUrl} 
                alt={kitName} 
                fill 
                className="object-cover"
                sizes="256px"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <ImageIcon className="h-8 w-8 opacity-20" />
                <span className="text-[10px]">No image available</span>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
        {confirmedPlayers.map((p) => {
          const hasNumber = p.number !== undefined && p.number !== null;
          return (
            <Badge 
              key={p.id} 
              variant="secondary" 
              className="text-[10px] py-0.5 px-2 h-6 font-bold gap-1 bg-primary/10 text-primary border-primary/20"
            >
              {p.isCaptain && <Crown className="h-3 w-3 text-accent" />}
              {hasNumber && <span className="mr-0.5 opacity-60">#{p.number}</span>}
              {p.nickname || p.name}
            </Badge>
          );
        })}
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

    const sampleKits = [
      { id: "kit-home-1", name: "Home 1", nameZh: "主場一", color: "Pink/Grey", colorZh: "粉紅/灰", imageUrl: "https://picsum.photos/seed/kit1/600/800" },
      { id: "kit-away-1", name: "Away 1", nameZh: "客場一", color: "Black/Black", colorZh: "全黑", imageUrl: "https://picsum.photos/seed/kit2/600/800" },
    ];

    sampleKits.forEach(k => {
      setDoc(doc(firestore, "kits", k.id), k);
    });

    const today = new Date().toISOString().split('T')[0];
    const in3Days = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

    const sampleGames = [
      { id: "seed-g1", date: today, startTime: "19:00", endTime: "21:00", location: "Central Sports Complex, Pitch 1", type: "League", team: "team-a", opponent: "Blue Arrows FC", coach: "Sir Alex", fee: "$100\nPayment via Bank Transfer", kitColors: "kit-home-1", alternativeKitColors: "kit-away-1", additionalDetails: "Please arrive 30 mins early for warm up." },
      { id: "seed-g2", date: in3Days, startTime: "18:30", endTime: "20:00", location: "Community Field A", type: "Training", team: "All", opponent: "N/A", coach: "Pep G", fee: "Free", kitColors: "kit-home-1", alternativeKitColors: "", additionalDetails: "Tactics session." },
    ];

    sampleGames.forEach(g => {
      setDoc(doc(firestore, "games", g.id), g);
    });

    const playerRef = doc(firestore, "players", user.uid);
    setDoc(playerRef, { 
      id: user.uid,
      teams: ["team-a", "team-b", "team-camp3"],
      status: "Active",
      number: (currentPlayer?.number !== undefined && currentPlayer?.number !== null) ? currentPlayer.number : 10
    }, { merge: true });

    toast({ title: "Seeding Complete", description: "Sample teams, kits, and games created." });
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
            <div className="text-muted-foreground text-sm max-w-sm">{dict.attendance.signinRequired}</div>
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
                          <div className="p-5 md:p-6 flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge className="text-[10px] md:text-xs font-bold bg-primary text-white px-3 py-0.5 border-none">{getTeamName(game.team)}</Badge>
                              <Badge variant="outline" className={cn(
                                "font-bold px-2 py-0.5 border-none text-[10px] uppercase tracking-wider",
                                game.type === 'League' ? "bg-primary text-white" : 
                                game.type === 'Training' ? "bg-accent text-white" :
                                game.type === 'Internal' ? "bg-indigo-600 text-white" :
                                "bg-muted text-foreground"
                              )}>
                                {dict.common.gameTypes[game.type] || game.type}
                              </Badge>
                              <span className="text-xs md:text-sm font-bold text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{game.startTime} - {game.endTime}</span>
                              {game.coach && (
                                <span className="text-[10px] md:text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                  <UserRound className="h-3.5 w-3.5 text-primary" />
                                  {game.coach}
                                </span>
                              )}
                              <div className="flex flex-wrap gap-3">
                                {game.kitColors && <KitBadge kitId={game.kitColors} />}
                                {game.alternativeKitColors && <KitBadge kitId={game.alternativeKitColors} isAlternative />}
                              </div>
                              {game.additionalDetails && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-4 shadow-xl">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                                        <Info className="h-3 w-3" /> {dict.attendance.detailsLabel}
                                      </div>
                                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                                        {game.additionalDetails}
                                      </p>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <h3 className="text-lg md:text-xl font-headline leading-tight">
                                {game.type === 'Training' || game.type === 'Internal' ? dict.common.gameTypes[game.type] : `${dict.common.matchVs} ${game.opponent || dict.common.tbd}`}
                              </h3>
                              <div className="grid gap-2 text-xs md:text-sm text-muted-foreground">
                                <div className="flex items-center gap-2.5"><Calendar className="h-4 w-4 text-primary shrink-0" />{formatGameDate(game.date)}</div>
                                <div className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-primary shrink-0" />{game.location}</div>
                              </div>
                            </div>

                            {game.fee && (
                              <div className="flex items-start gap-2 text-primary font-bold text-[11px] md:text-xs pt-1">
                                <Banknote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span className="whitespace-pre-wrap leading-normal">{game.fee}</span>
                              </div>
                            )}
                            
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
                    {players?.map((p) => {
                      const hasNumber = p.number !== undefined && p.number !== null;
                      return (
                        <div key={p.id} className="py-2.5 flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px] border border-primary/10">
                            {hasNumber ? p.number : p.name[0]}
                          </div>
                          <div className="flex-1 text-xs font-bold truncate text-foreground/90">{p.nickname || p.name}</div>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
                            {p.teams?.map(tId => (
                              <Badge key={tId} variant="outline" className="text-[8px] h-4 px-1 bg-primary text-white border-none whitespace-nowrap">{getTeamName(tId)}</Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
