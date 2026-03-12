"use client";

import { useSearchParams } from "next/navigation";
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
  Banknote
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

const KIT_COLORS: Record<string, string> = {
  "Home 1: Pink/Grey": "text-pink-500",
  "Home 2: New White / New White": "text-slate-300",
  "Away 1: Black/Black": "text-slate-950",
  "Away 2: White/White": "text-slate-300",
  "TBD": "text-muted-foreground"
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
      description: `Attendance set to ${status === 'Confirmed' ? dict.common.confirm : status === 'Declined' ? dict.common.decline : dict.common.pending}.`,
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
          <Link href="/attendance" className="inline-flex items-center text-sm font-bold text-primary hover:underline mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {dict.attendance.backToSchedule}
          </Link>
          
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge 
                className={cn(
                  "font-bold bg-primary text-white px-3 py-1 text-[10px] md:text-xs border-none"
                )}
              >
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
              {specificGame.kitColors && (
                <Badge variant="outline" className={cn("font-bold gap-1.5 py-1", KIT_COLORS[specificGame.kitColors] || "text-muted-foreground")}>
                  <Shirt className="h-3.5 w-3.5" />
                  {dict.common.kits[specificGame.kitColors as keyof typeof dict.common.kits] || specificGame.kitColors}
                </Badge>
              )}
              {specificGame.additionalDetails && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                      <Info className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-6 shadow-2xl rounded-2xl">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
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
            <GameRosterList gameId={gameId} teams={teams || []} onStatusChange={handleStatusChange} />
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

function ConfirmedAttendanceList({ games, userId, teams }: { games: Game[], userId: string, teams: Team[] }) {
  const { dict } = useTranslation();
  
  return (
    <div className="space-y-6">
      {games.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 rounded-2xl flex flex-col items-center gap-4">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">No confirmed games found in your schedule.</p>
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
          <span className="text-emerald-600 flex items-center gap-1"><Check className="h-4 w-4" /> {confirmedCount}</span>
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
        </div>
      </CardContent>
    </Card>
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
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-5 shadow-2xl rounded-2xl">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
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
            {game.kitColors && (
              <div className="flex items-start gap-4 text-muted-foreground">
                <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
                  <Shirt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">{dict.games.dialog.kit}</p>
                  <p className={cn("font-bold text-sm", KIT_COLORS[game.kitColors] || "text-foreground")}>
                    {dict.common.kits[game.kitColors as keyof typeof dict.common.kits] || game.kitColors}
                  </p>
                </div>
              </div>
            )}
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
