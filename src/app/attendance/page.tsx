
"use client";

import { useSearchParams } from "next/navigation";
import { MainNav } from "@/components/layout/main-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Calendar,
  Shirt,
  Lock,
  Users,
  ChevronLeft,
  MoreVertical,
  Loader2,
  Crown,
  Info
} from "lucide-react";
import { Game, AttendanceStatus, Player, Attendance, Team } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useTranslation } from "@/components/language-provider";

const KIT_MAP: Record<string, string> = {
  "Home 1: Pink/Grey": "text-pink-500",
  "Home 2: New White / New White": "text-slate-300",
  "Away 1: Black/Black": "text-slate-950",
  "Away 2: White/White": "text-slate-300",
  "TBD": "text-muted-foreground"
};

const getKitColorClass = (kitLabel: string) => {
  return KIT_MAP[kitLabel] || "text-muted-foreground";
};

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId");
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { language, dict } = useTranslation();

  const teamsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "teams");
  }, [firestore, user, isUserLoading]);
  const { data: teams } = useCollection<Team>(teamsQuery);

  const gameRef = useMemoFirebase(() => {
    if (isUserLoading || !user || !gameId) return null;
    return doc(firestore, "games", gameId);
  }, [firestore, user, isUserLoading, gameId]);
  
  const { data: specificGame, isLoading: isGameLoading } = useDoc<Game>(gameRef);

  const gamesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user || gameId) return null;
    return query(collection(firestore, "games"), orderBy("date", "asc"));
  }, [firestore, user, gameId, isUserLoading]);

  const { data: games, isLoading: isGamesLoading } = useCollection<Game>(gamesQuery);

  const handleStatusChange = (gameId: string, status: AttendanceStatus, targetPlayerId?: string) => {
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

    toast({
      title: "Status Updated",
      description: `Attendance set to ${status === 'Confirmed' ? dict.common.join : status === 'Declined' ? dict.common.decline : dict.common.pending}.`,
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

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
            <h1 className="text-xl md:text-2xl font-headline">Game not found</h1>
            <Link href="/games" className="text-primary hover:underline mt-4 inline-block font-bold">Return to Schedule</Link>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background pb-12">
        <MainNav />
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Link href="/games" className="inline-flex items-center text-sm font-bold text-primary hover:underline mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {dict.attendance.backToSchedule}
          </Link>
          
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Badge 
                variant="outline"
                className={cn(
                  "font-bold border-none text-white bg-primary px-3 py-1 text-[10px] md:text-xs"
                )}
              >
                {getTeamName(specificGame.team)}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-headline leading-tight">
              {specificGame.type === 'Training' || specificGame.type === 'Internal' 
                ? dict.common.gameTypes[specificGame.type] 
                : `${dict.common.matchVs} ${specificGame.opponent || dict.common.tbd}`}
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-5 text-muted-foreground text-xs md:text-sm">
              <span className="flex items-center gap-2 font-medium"><Calendar className="h-4 w-4 text-primary shrink-0" /> {formatGameDate(specificGame.date)}</span>
              <span className="flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-primary shrink-0" /> {specificGame.startTime} - {specificGame.endTime}</span>
              <span className="flex items-center gap-2 font-medium"><MapPin className="h-4 w-4 text-primary shrink-0" /> {specificGame.location}</span>
            </div>
            {specificGame.additionalDetails && (
              <div className="mt-6 p-4 bg-muted/20 border-l-4 border-primary/40 rounded-r-xl max-w-2xl">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                  <Info className="h-3.5 w-3.5" />
                  {dict.attendance.detailsLabel}
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {specificGame.additionalDetails}
                </p>
              </div>
            )}
          </header>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <GameRosterList gameId={gameId} teams={teams || []} onStatusChange={handleStatusChange} />
            </div>
            <div className="space-y-6 order-1 lg:order-2 lg:sticky lg:top-24 h-fit">
              <AttendanceCard game={specificGame} userId={user.uid} teams={teams || []} onStatusChange={handleStatusChange} isCondensed />
            </div>
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

        <div className="space-y-8 max-w-4xl">
          {isGamesLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted/50 rounded-2xl" />
            ))
          ) : !games || games.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2 rounded-2xl">
              <p className="text-muted-foreground">No upcoming events to confirm.</p>
            </Card>
          ) : (
            games.map((game) => (
              <AttendanceCard 
                key={game.id} 
                game={game} 
                userId={user.uid} 
                teams={teams || []}
                onStatusChange={handleStatusChange} 
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function GameRosterList({ 
  gameId, 
  teams,
  onStatusChange 
}: { 
  gameId: string;
  teams: Team[];
  onStatusChange: (gameId: string, status: AttendanceStatus, targetPlayerId?: string) => void;
}) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { dict, language } = useTranslation();
  
  const playerRef = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user, isUserLoading]);
  const { data: currentPlayer } = useDoc<Player>(playerRef);

  const playersQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "players");
  }, [firestore, user, isUserLoading]);
  const { data: players } = useCollection<Player>(playersQuery);
  
  const attendanceQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "games", gameId, "attendanceRecords");
  }, [firestore, gameId, user, isUserLoading]);
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

  return (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-primary/5 px-5 py-4 flex flex-row items-center justify-between border-b">
        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {dict.attendance.rosterTitle}
        </CardTitle>
        <div className="flex gap-4 text-sm font-bold">
          <span className="text-accent flex items-center gap-1"><Check className="h-4 w-4" /> {confirmedCount}</span>
          <span className="text-destructive flex items-center gap-1"><X className="h-4 w-4" /> {declinedCount}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {players?.map((player) => {
            const status = getStatus(player.id);
            return (
              <div key={player.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                  <div className="relative shrink-0">
                    <div className={cn(
                      "h-10 w-10 md:h-11 md:w-11 rounded-full flex items-center justify-center font-bold bg-primary/10 text-primary border border-primary/5"
                    )}>
                      {player.number || player.name[0]}
                    </div>
                    {player.isCaptain && (
                      <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full p-0.5 shadow-sm border border-white">
                        <Crown className="h-3 w-3" />
                      </div>
                    )}
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
                      status === 'Confirmed' && "bg-accent hover:bg-accent",
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
                        <DropdownMenuItem onClick={() => onStatusChange(gameId, 'Confirmed', player.id)} className="text-accent font-bold py-2.5">
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
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceCard({ 
  game, 
  userId, 
  teams,
  onStatusChange, 
  isCondensed = false 
}: { 
  game: Game, 
  userId: string, 
  teams: Team[],
  onStatusChange: (id: string, s: AttendanceStatus) => void, 
  isCondensed?: boolean 
}) {
  const firestore = useFirestore();
  const { language, dict } = useTranslation();
  const attendanceRef = useMemoFirebase(() => doc(firestore, "games", game.id, "attendanceRecords", userId), [firestore, game.id, userId]);
  const { data: attendance } = useDoc<any>(attendanceRef);
  
  const currentStatus: AttendanceStatus = attendance?.status || 'Pending';

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

  if (isCondensed) {
    return (
      <Card className="border-none shadow-lg overflow-hidden bg-white rounded-2xl">
        <CardHeader className="pb-3 pt-5 px-6">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            {dict.attendance.myStatus}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-dashed">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{dict.attendance.currently}:</span>
            <Badge className={cn(
              "font-bold px-3 py-1 text-[10px] md:text-xs",
              currentStatus === 'Confirmed' ? "bg-accent" : 
              currentStatus === 'Declined' ? "bg-destructive" : "bg-amber-500"
            )}>
              {currentStatus === 'Confirmed' ? dict.common.confirm : currentStatus === 'Declined' ? dict.common.decline : dict.common.pending}
            </Badge>
          </div>
          <div className="grid gap-3">
            <Button 
              size="lg"
              onClick={() => onStatusChange(game.id, 'Confirmed')}
              className={cn(
                "w-full gap-2 transition-all font-bold h-12 shadow-sm",
                currentStatus === 'Confirmed' ? "bg-accent hover:bg-accent/90" : "bg-white text-foreground border border-input hover:bg-accent/10"
              )}
            >
              <Check className="h-5 w-5" />
              {dict.common.join}
            </Button>
            <Button 
              size="lg"
              onClick={() => onStatusChange(game.id, 'Declined')}
              variant="outline"
              className={cn(
                "w-full gap-2 transition-all font-bold h-12",
                currentStatus === 'Declined' ? "bg-destructive text-white border-destructive hover:bg-destructive/90" : "hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
              )}
            >
              <X className="h-5 w-5" />
              {dict.common.decline}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-none shadow-lg overflow-hidden transition-all rounded-2xl",
      currentStatus === 'Confirmed' ? "ring-2 ring-accent bg-accent/5" : 
      currentStatus === 'Declined' ? "ring-2 ring-destructive bg-destructive/5" : ""
    )}>
      <CardHeader className="border-b bg-white/50 pb-5 pt-6 px-6">
        <div className="flex items-center justify-between gap-4">
          <Badge 
            variant="outline"
            className={cn(
              "font-bold border-none text-white bg-primary px-3 py-0.5 text-[10px]"
            )}
          >
            {getTeamName(game.team)}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap overflow-hidden">
            {currentStatus === 'Pending' ? (
              <span className="flex items-center text-amber-600">
                {dict.attendance.confirmationRequired}
              </span>
            ) : (
              <span className={cn(
                "flex items-center truncate",
                currentStatus === 'Confirmed' ? "text-accent" : "text-destructive"
              )}>
                {currentStatus === 'Confirmed' ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <X className="h-3.5 w-3.5 mr-1.5" />}
                {currentStatus === 'Confirmed' ? dict.common.confirm : currentStatus === 'Declined' ? dict.common.decline : dict.common.pending}
              </span>
            )}
          </div>
        </div>
        <CardTitle className="text-xl md:text-2xl mt-4 font-headline leading-tight">
          {game.type === 'Training' || game.type === 'Internal' 
            ? dict.common.gameTypes[game.type] 
            : `${dict.common.matchVs} ${game.opponent || dict.common.tbd}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 px-6 pb-6 grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">{dict.attendance.dateLabel}</p>
              <p className="font-bold text-foreground text-sm md:text-base">{formatGameDate(game.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">{dict.attendance.timeLabel}</p>
              <p className="font-bold text-foreground text-sm md:text-base">{game.startTime} - {game.endTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">{dict.attendance.locationLabel}</p>
              <p className="font-bold text-foreground text-sm md:text-base">{game.location}</p>
            </div>
          </div>
          {game.kitColors && (
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="bg-accent/10 p-2.5 rounded-full shrink-0">
                <Shirt className={cn("h-5 w-5", getKitColorClass(game.kitColors))} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">{dict.games.dialog.kit}</p>
                <p className={cn("font-bold text-sm md:text-base", getKitColorClass(game.kitColors))}>{dict.common.kits[game.kitColors as keyof typeof dict.common.kits] || game.kitColors}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center items-center gap-5 bg-muted/20 p-6 rounded-2xl border border-dashed text-foreground">
          <div className="font-bold text-center text-sm uppercase tracking-widest opacity-70">{dict.attendance.attendingQuestion}</div>
          <div className="flex flex-col sm:flex-row w-full gap-3">
            <Button 
              onClick={() => onStatusChange(game.id, 'Confirmed')}
              className={cn(
                "flex-1 gap-2 transition-all font-bold h-12 text-sm",
                currentStatus === 'Confirmed' ? "bg-accent scale-[1.02] shadow-md" : "bg-white text-foreground border border-input hover:bg-accent/10 hover:border-accent"
              )}
            >
              <Check className="h-4 w-4" />
              {dict.common.join}
            </Button>
            <Button 
              onClick={() => onStatusChange(game.id, 'Declined')}
              variant="outline"
              className={cn(
                "flex-1 gap-2 transition-all font-bold h-12 text-sm",
                currentStatus === 'Declined' ? "bg-destructive text-white border-destructive scale-[1.02] shadow-md" : "bg-white text-foreground border border-input hover:bg-destructive/10 hover:border-destructive"
              )}
            >
              <X className="h-4 w-4" />
              {dict.common.decline}
            </Button>
          </div>
          <Link href={`/attendance?gameId=${game.id}`} className="text-[11px] text-primary font-bold hover:underline uppercase tracking-wider py-1">
            {dict.attendance.viewFullRoster}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function UserCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
