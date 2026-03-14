"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MainNav } from "@/components/layout/main-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Calendar,
  Lock,
  Users,
  ChevronLeft,
  MoreVertical,
  Loader2,
  Crown,
  Info,
  CalendarCheck,
  Shirt,
  UserRound,
  Banknote,
  UserPlus,
  LogIn
} from "lucide-react";
import { Game, AttendanceStatus, Player, Attendance, Team } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, useAuth } from "@/firebase";
import { collection, query, orderBy, doc, setDoc, where, deleteDoc, getDocs, limit } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useTranslation } from "@/components/language-provider";
import { KitBadge } from "@/app/page";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";

function AttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get("gameId");
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { language, dict } = useTranslation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFirstRunCheck, setIsFirstRunCheck] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      const playersRef = collection(firestore, "players");
      getDocs(query(playersRef, limit(1)))
        .then(snapshot => {
          setIsFirstRunCheck(snapshot.empty);
        })
        .catch(() => {
          setIsFirstRunCheck(false);
        });
    } else if (!isUserLoading) {
      setIsFirstRunCheck(false);
    }
  }, [user, firestore, isUserLoading]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);

      if (result.user.email) {
        // Normalize email: trim and lowercase
        const normalizedEmail = result.user.email.trim().toLowerCase();
        
        const playersRef = collection(firestore, "players");
        const q = query(playersRef, where("email", "==", normalizedEmail));
        const snapshot = await getDocs(q);

        const allPlayersSnapshot = await getDocs(query(playersRef, limit(1)));
        const isFirstRun = allPlayersSnapshot.empty;
        const isUserSuperAdmin = SUPER_ADMIN_EMAILS.includes(normalizedEmail);

        if (snapshot.empty && !isFirstRun && !isUserSuperAdmin) {
          await signOut(auth);
          toast({
            variant: "destructive",
            title: dict.nav.unauthorizedEmailTitle,
            description: dict.nav.unauthorizedEmailDesc,
          });
          return;
        }
      }

      router.push('/');
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast({
          variant: "destructive",
          title: language === 'zh' ? "登入失敗" : "Sign in failed",
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const playerRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user]);
  const { data: currentPlayer, isLoading: isProfileLoading } = useDoc<Player>(playerRef);

  const emailMatchQuery = useMemoFirebase(() => {
    if (!user || currentPlayer) return null;
    // Normalize email for search
    const normalizedEmail = user.email?.trim().toLowerCase() || "";
    return query(collection(firestore, "players"), where("email", "==", normalizedEmail), limit(1));
  }, [firestore, user, currentPlayer]);
  const { data: matchedProfiles, isLoading: isMatchedProfilesLoading } = useCollection<Player>(emailMatchQuery);

  // Guard: super admins check
  const normalizedUserEmail = user?.email?.trim().toLowerCase() || "";
  const isSuperAdminEmailCheck = !!user?.email && SUPER_ADMIN_EMAILS.includes(normalizedUserEmail);
  const isAuthorized = !!user && (!!currentPlayer || (matchedProfiles && matchedProfiles.length > 0) || isFirstRunCheck === true || isSuperAdminEmailCheck);
  const isAuthChecking = !!user && !isAuthorized;

  const teamsQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(firestore, "teams");
  }, [firestore, isAuthorized]);
  const { data: teams } = useCollection<Team>(teamsQuery);

  const gameRef = useMemoFirebase(() => {
    if (!isAuthorized || !gameId) return null;
    return doc(firestore, "games", gameId);
  }, [firestore, isAuthorized, gameId]);
  
  const { data: specificGame, isLoading: isGameLoading } = useDoc<Game>(gameRef);

  const gamesQuery = useMemoFirebase(() => {
    if (!isAuthorized || gameId) return null;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    return query(
      collection(firestore, "games"), 
      where("date", ">=", todayStr),
      orderBy("date", "asc")
    );
  }, [firestore, isAuthorized, gameId]);

  const { data: games, isLoading: isGamesLoading } = useCollection<Game>(gamesQuery);

  const handleStatusChange = (gameId: string, status: AttendanceStatus, targetPlayerId?: string, isGuest?: boolean) => {
    if (!user) return;

    const playerId = targetPlayerId || user.uid;
    const attendanceRef = doc(firestore, "games", gameId, "attendanceRecords", playerId);
    
    const attendanceData = {
      id: playerId,
      playerId: playerId,
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

    const statusLabel = status === 'Confirmed' ? dict.common.confirm : status === 'Declined' ? dict.common.decline : dict.common.pending;
    toast({
      title: dict.attendance.toasts.statusUpdated,
      description: dict.attendance.toasts.statusDesc(statusLabel),
    });
  };

  const getTeamName = (teamId: string) => {
    if (teamId === 'All') return dict.common.teams.All;
    const team = teams?.find(t => t.id === teamId);
    if (!team) return teamId;
    return language === 'zh' ? team.nameZh : team.name;
  };

  const formatGameDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'zh') {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      const weekday = weekdays[date.getDay()];
      return `${month}月${day}日 ${weekday}`;
    }
    return date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  useEffect(() => {
    if (user && !isProfileLoading && !isMatchedProfilesLoading && isFirstRunCheck === false && !isAuthorized) {
      signOut(auth).then(() => {
        toast({
          variant: "destructive",
          title: dict.nav.unauthorizedEmailTitle,
          description: dict.nav.unauthorizedEmailDesc,
        });
      });
    }
  }, [user, isAuthorized, isProfileLoading, isMatchedProfilesLoading, isFirstRunCheck, auth, toast, dict.nav]);

  if (isUserLoading || isAuthChecking) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="mt-4 text-muted-foreground font-medium">{dict.common.loading}</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center px-6">
          <div className="bg-muted p-6 rounded-full mb-6">
            <Lock className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-headline mb-4">{dict.attendance.signinRequired}</h1>
          <p className="text-muted-foreground max-w-md mb-8 text-sm md:text-base">
            {dict.attendance.signinDesc}
          </p>
          <Button onClick={handleLogin} disabled={isLoggingIn} className="bg-primary hover:bg-primary/90 gap-2 font-bold h-11 px-8 shadow-md rounded-xl">
            {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {dict.nav.signIn}
          </Button>
        </main>
      </div>
    );
  }

  if (gameId) {
    if (isGameLoading) {
      return (
        <div className="min-h-screen bg-background">
          <MainNav />
          <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">{dict.common.loading}</p>
          </main>
        </div>
      );
    }

    if (!specificGame) {
      return (
        <div className="min-h-screen bg-background">
          <MainNav />
          <main className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-xl md:text-2xl font-headline">{dict.attendance.fixtureNotFound}</h1>
            <Link href="/attendance" className="text-primary hover:underline mt-4 inline-block font-bold">{dict.attendance.returnToFixtures}</Link>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background pb-12">
        <MainNav />
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Link href="/attendance" className="inline-flex items-center text-sm font-bold text-primary hover:underline mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {dict.attendance.backToFixtures}
          </Link>
          
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge className="font-bold bg-primary text-white px-3 py-1 text-[10px] md:text-xs border-none">
                {getTeamName(specificGame.team)}
              </Badge>
              <Badge variant="outline" className={cn(
                "font-bold px-3 py-1 border-none text-[10px] md:text-xs uppercase tracking-wider",
                specificGame.type === 'League' ? "bg-primary text-white" : 
                specificGame.type === 'Training' ? "bg-accent text-white" :
                specificGame.type === 'Internal' ? "bg-indigo-600 text-white" :
                "bg-muted text-foreground"
              )}>
                {dict.common.gameTypes[specificGame.type] || specificGame.type}
              </Badge>
              <KitBadge kitId={specificGame.kitColors} />
              <KitBadge kitId={specificGame.alternativeKitColors} isAlternative />
              {specificGame.additionalDetails && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20">
                      <Info className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-6 shadow-2xl rounded-2xl">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-destructive uppercase tracking-widest">
                        <Info className="h-4 w-4" /> {dict.attendance.detailsLabel}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {specificGame.additionalDetails}
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-headline leading-tight mb-4">
              {specificGame.type === 'Training' || specificGame.type === 'Internal' 
                ? dict.common.gameTypes[specificGame.type] 
                : `${dict.common.matchVs} ${specificGame.opponent || dict.common.tbd}`}
            </h1>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-muted-foreground text-xs md:text-sm">
                <span className="flex items-center gap-2 font-medium"><Calendar className="h-4 w-4 text-primary shrink-0" /> {formatGameDate(specificGame.date)}</span>
                <span className="flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-primary shrink-0" /> {specificGame.startTime} - {specificGame.endTime}</span>
                {specificGame.coach && (
                  <span className="flex items-center gap-2 font-medium"><UserRound className="h-4 w-4 text-primary shrink-0" /> {specificGame.coach}</span>
                )}
              </div>
              <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs md:text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" /> {specificGame.location}
              </div>
              {specificGame.fee && (
                <div className="flex items-start gap-2 text-primary font-bold text-xs md:text-sm">
                  <Banknote className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-wrap">{specificGame.fee}</span>
                </div>
              )}
            </div>
          </header>

          <div className="max-w-4xl">
            <GameRosterList gameId={gameId} teams={teams || []} onStatusChange={handleStatusChange} isAuthorized={isAuthorized} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-headline mb-2">{dict.attendance.title}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{dict.attendance.subtitle}</p>
        </header>

        <div className="space-y-6 max-w-4xl">
          {isGamesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted/50 rounded-2xl" />
            ))
          ) : (
            <ConfirmedAttendanceList 
              games={games || []} 
              userId={user.uid} 
              teams={teams || []} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    }>
      <AttendanceContent />
    </Suspense>
  );
}

function ConfirmedAttendanceList({ games, userId, teams }: { games: Game[], userId: string, teams: Team[] }) {
  const { dict } = useTranslation();
  
  return (
    <div className="space-y-6">
      {games.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 rounded-2xl flex flex-col items-center gap-4">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">{dict.attendance.noConfirmedFixtures}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {games.map((game) => (
            <ConfirmedGameItem key={game.id} game={game} userId={userId} teams={teams} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmedGameItem({ game, userId, teams }: { game: Game, userId: string, teams: Team[] }) {
  const firestore = useFirestore();
  const attendanceRef = useMemoFirebase(() => doc(firestore, "games", game.id, "attendanceRecords", userId), [firestore, game.id, userId]);
  const { data: attendance, isLoading } = useDoc<Attendance>(attendanceRef);

  if (isLoading) return <Card className="h-48 animate-pulse bg-muted/50 rounded-2xl" />;
  if (attendance?.status !== 'Confirmed') return null;

  return (
    <AttendanceCard 
      game={game} 
      userId={userId} 
      teams={teams}
    />
  );
}

function GameRosterList({ 
  gameId, 
  teams,
  onStatusChange,
  isAuthorized
}: { 
  gameId: string;
  teams: Team[];
  onStatusChange: (gameId: string, status: AttendanceStatus, targetPlayerId?: string, isGuest?: boolean) => void;
  isAuthorized: boolean;
}) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { dict, language } = useTranslation();
  const { toast } = useToast();
  
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [guestName, setGuestName] = useState("");

  const playerRef = useMemoFirebase(() => {
    if (!isAuthorized || !user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user, isAuthorized]);
  const { data: currentPlayer } = useDoc<Player>(playerRef);

  const playersQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(firestore, "players");
  }, [firestore, isAuthorized]);
  const { data: players } = useCollection<Player>(playersQuery);
  
  const attendanceQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(firestore, "games", gameId, "attendanceRecords");
  }, [firestore, gameId, isAuthorized]);
  const { data: attendanceDocs } = useCollection<Attendance>(attendanceQuery);

  const getStatus = (playerId: string) => {
    return attendanceDocs?.find(a => a.playerId === playerId)?.status || "Pending";
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return teamId;
    return language === 'zh' ? team.nameZh : team.name;
  };

  const confirmedCount = attendanceDocs?.filter(a => a.status === 'Confirmed').length || 0;
  const declinedCount = attendanceDocs?.filter(a => a.status === 'Declined').length || 0;

  const handleAddGuest = () => {
    if (!guestName.trim()) return;
    
    const guestId = `guest-${Math.random().toString(36).substring(2, 11)}`;
    const attendanceRef = doc(firestore, "games", gameId, "attendanceRecords", guestId);
    
    const guestData = {
      id: guestId,
      playerId: guestId,
      gameId: gameId,
      status: 'Confirmed' as AttendanceStatus,
      isGuest: true,
      guestName: guestName,
      lastUpdated: new Date().toISOString()
    };

    setDoc(attendanceRef, guestData)
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: attendanceRef.path,
          operation: 'write',
          requestResourceData: guestData
        } satisfies SecurityRuleContext));
      });

    setGuestName("");
    setIsGuestDialogOpen(false);
    toast({
      title: dict.attendance.toasts.guestAdded,
      description: dict.attendance.toasts.guestAddedDesc,
    });
  };

  const handleDeleteGuest = (id: string) => {
    const ref = doc(firestore, "games", gameId, "attendanceRecords", id);
    deleteDoc(ref);
  };

  const guestAttendances = attendanceDocs?.filter(a => a.isGuest) || [];

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-primary/5 px-5 py-4 flex flex-row items-center justify-between border-b">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {dict.attendance.rosterTitle}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex gap-3 text-xs md:text-sm font-bold">
              <span className="text-emerald-600 flex items-center gap-1"><Check className="h-4 w-4" /> {confirmedCount}</span>
              <span className="text-destructive flex items-center gap-1"><X className="h-4 w-4" /> {declinedCount}</span>
            </div>
            {currentPlayer?.isAdmin && (
              <Button size="sm" onClick={() => setIsGuestDialogOpen(true)} className="bg-accent hover:bg-accent/90 font-bold h-8 text-[10px] uppercase tracking-wider">
                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> {dict.attendance.addGuest}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {players?.map((player) => {
              const status = getStatus(player.id);
              const hasNumber = player.number !== undefined && player.number !== null;
              return (
                <div key={player.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <div className="shrink-0">
                      <div className={cn(
                        "h-10 w-10 md:h-11 md:w-11 rounded-full flex items-center justify-center font-bold bg-primary/10 text-primary border border-primary/5 relative"
                      )}>
                        {hasNumber ? player.number : player.name[0]}
                        {player.isCaptain && (
                          <div className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground rounded-full p-1 shadow-md border-2 border-white">
                            <Crown className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold flex items-center gap-2 truncate">
                        <span className="truncate">{player.name}</span>
                        {player.nickname && <span className="hidden sm:inline-flex text-muted-foreground text-xs italic font-normal">"{player.nickname}"</span>}
                        {player.isCaptain && (
                          <Badge variant="secondary" className="bg-accent/20 text-accent text-[9px] font-bold h-4 px-1 leading-none uppercase tracking-wider hidden sm:flex">
                            {dict.common.captain}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground truncate">
                        <span className="font-bold text-primary">
                          {player.teams?.map(getTeamName).join(', ')}
                        </span>
                        {" • "}{player.preferredPositions?.map(pos => dict.common.positions[pos.toLowerCase() as keyof typeof dict.common.positions] || pos).join(', ') || dict.common.any}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge 
                      variant={status === 'Confirmed' ? 'default' : status === 'Declined' ? 'destructive' : 'outline'}
                      className={cn(
                        "min-w-[80px] md:min-w-[95px] justify-center font-bold text-[10px] md:text-xs py-1",
                        status === 'Confirmed' && "bg-emerald-500 hover:bg-emerald-500",
                        status === 'Pending' && "border-amber-500 text-amber-600"
                      )}
                    >
                      {status === 'Confirmed' ? dict.common.confirm : status === 'Declined' ? dict.common.decline : dict.common.pending}
                    </Badge>

                    {currentPlayer?.isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground">{dict.dashboard.roles}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onStatusChange(gameId, 'Confirmed', player.id)} className="text-emerald-600 font-bold py-2.5">
                            <Check className="mr-2 h-4 w-4" /> {dict.common.confirm}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onStatusChange(gameId, 'Declined', player.id)} className="text-destructive font-bold py-2.5">
                            <X className="mr-2 h-4 w-4" /> {dict.common.decline}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onStatusChange(gameId, 'Pending', player.id)} className="text-amber-600 font-bold py-2.5">
                            <Clock className="mr-2 h-4 w-4" /> {dict.common.pending}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Guest Players */}
            {guestAttendances.map((guest) => (
              <div key={guest.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors bg-accent/5">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                  <div className="shrink-0">
                    <div className="h-10 w-10 md:h-11 md:w-11 rounded-full flex items-center justify-center font-bold bg-accent/10 text-accent border border-accent/20">
                      {guest.guestName?.[0] || "?"}
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold flex items-center gap-2 truncate">
                      <span className="truncate">{guest.guestName}</span>
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5 uppercase font-bold bg-accent text-accent-foreground border-none">
                        {dict.attendance.guest}
                      </Badge>
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">
                      {dict.attendance.guest}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <Badge 
                    className={cn(
                      "min-w-[80px] md:min-w-[95px] justify-center font-bold text-[10px] md:text-xs py-1 bg-emerald-500"
                    )}
                  >
                    {dict.common.confirm}
                  </Badge>

                  {currentPlayer?.isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleDeleteGuest(guest.id)} className="text-destructive font-bold py-2.5">
                          <X className="mr-2 h-4 w-4" /> {dict.common.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Suspense>
        <Dialog open={isGuestDialogOpen} onOpenChange={setIsGuestDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-headline">{dict.attendance.addGuest}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="guestName" className="text-xs uppercase tracking-wider">{dict.attendance.guestName}</Label>
                <Input 
                  id="guestName" 
                  value={guestName} 
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Name"
                  className="h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddGuest} className="w-full font-bold h-11 bg-primary">
                {dict.common.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Suspense>
    </div>
  );
}

function AttendanceCard({ 
  game, 
  userId, 
  teams,
}: { 
  game: Game, 
  userId: string, 
  teams: Team[],
}) {
  const { language, dict } = useTranslation();
  
  const getTeamName = (teamId: string) => {
    if (teamId === 'All') return dict.common.teams.All;
    const team = teams.find(t => t.id === teamId);
    if (!team) return teamId;
    return language === 'zh' ? team.nameZh : team.name;
  };

  const formatGameDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'zh') {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      const weekday = weekdays[date.getDay()];
      return `${month}月${day}日 ${weekday}`;
    }
    return date.toLocaleDateString('default', { dateStyle: 'full' });
  };

  return (
    <Card className="border-none shadow-lg overflow-hidden transition-all rounded-2xl ring-2 ring-emerald-500 bg-emerald-50/10">
      <CardHeader className="border-b bg-white/50 pb-5 pt-6 px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              className={cn(
                "font-bold border-none text-white bg-primary px-3 py-0.5 text-[10px]"
              )}
            >
              {getTeamName(game.team)}
            </Badge>
            <Badge variant="outline" className={cn(
              "font-bold px-3 py-0.5 border-none text-[10px] uppercase tracking-wider",
              game.type === 'League' ? "bg-primary text-white" : 
              game.type === 'Training' ? "bg-accent text-white" :
              game.type === 'Internal' ? "bg-indigo-600 text-white" :
              "bg-muted text-foreground"
            )}>
              {dict.common.gameTypes[game.type] || game.type}
            </Badge>
            {game.additionalDetails && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20">
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-5 shadow-2xl rounded-2xl">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-destructive uppercase tracking-widest">
                      <Info className="h-4 w-4" /> {dict.attendance.detailsLabel}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {game.additionalDetails}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            {dict.common.confirm}
          </div>
        </div>
        <CardTitle className="text-xl md:text-2xl mt-4 font-headline leading-tight">
          {game.type === 'Training' || game.type === 'Internal' 
            ? dict.common.gameTypes[game.type] 
            : `${dict.common.matchVs} ${game.opponent || dict.common.tbd}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 px-6 pb-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
            <div className="flex items-start gap-4 text-muted-foreground">
              <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">{dict.attendance.dateLabel}</p>
                <p className="font-bold text-foreground text-sm">{formatGameDate(game.date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-muted-foreground">
              <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">{dict.attendance.timeLabel}</p>
                <p className="font-bold text-foreground text-sm">{game.startTime} - {game.endTime}</p>
              </div>
            </div>
            {game.coach && (
              <div className="flex items-start gap-4 text-muted-foreground">
                <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
                  <UserRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">{dict.games.dialog.coach}</p>
                  <p className="font-bold text-foreground text-sm leading-snug">{game.coach}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-4 text-muted-foreground">
              <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
                <Shirt className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col gap-3">
                <KitBadge kitId={game.kitColors} />
                <KitBadge kitId={game.alternativeKitColors} isAlternative />
              </div>
            </div>
          </div>
          <div className="shrink-0 pt-1">
            <Button variant="outline" className="font-bold border-primary text-primary hover:bg-primary/5 gap-2 w-full md:w-auto" asChild>
              <Link href={`/attendance?gameId=${game.id}`}>
                {dict.attendance.viewFullRoster}
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-4 pt-4 border-t border-dashed text-muted-foreground">
          <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">{dict.attendance.locationLabel}</p>
            <p className="font-bold text-foreground text-sm leading-snug">{game.location}</p>
          </div>
        </div>

        {game.fee && (
          <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <Banknote className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">{dict.attendance.feeLabel}</p>
              <p className="font-bold text-primary text-sm whitespace-pre-wrap">{game.fee}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}