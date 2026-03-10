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
  Crown
} from "lucide-react";
import { Game, AttendanceStatus, Player, Attendance } from "@/lib/types";
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
      description: `Attendance set to ${status}.`,
    });
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
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="bg-muted p-6 rounded-full mb-6">
            <Lock className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-headline mb-4">Sign in required</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            Please sign in with your Google account to manage your availability for upcoming team events.
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
            <p className="mt-4 text-muted-foreground">Loading roster...</p>
          </main>
        </div>
      );
    }

    if (!specificGame) {
      return (
        <div className="min-h-screen bg-background">
          <MainNav />
          <main className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-headline">Game not found</h1>
            <Link href="/games" className="text-primary hover:underline mt-4 inline-block font-bold">Return to Schedule</Link>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background pb-12">
        <MainNav />
        <main className="container mx-auto px-4 py-8">
          <Link href="/games" className="inline-flex items-center text-sm font-bold text-primary hover:underline mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Schedule
          </Link>
          
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-primary">{specificGame.type}</Badge>
              <Badge 
                variant="outline"
                className={cn(
                  "font-bold border-none text-white",
                  specificGame.team === 'A' ? "bg-primary" : 
                  specificGame.team === 'B' ? "bg-indigo-600" : 
                  "bg-muted text-muted-foreground"
                )}
              >
                Team {specificGame.team}
              </Badge>
            </div>
            <h1 className="text-3xl font-headline">
              {specificGame.type === 'Training' ? 'Team Training Session' : 
               specificGame.type === 'Internal' ? 'Internal Squad Game' : 
               `Match vs ${specificGame.opponent || 'TBD'}`}
            </h1>
            <div className="flex flex-wrap gap-4 mt-4 text-muted-foreground text-sm">
              <span className="flex items-center gap-1.5 font-medium"><Calendar className="h-4 w-4" /> {new Date(specificGame.date).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5 font-medium"><Clock className="h-4 w-4" /> {specificGame.startTime} - {specificGame.endTime}</span>
              <span className="flex items-center gap-1.5 font-medium"><MapPin className="h-4 w-4" /> {specificGame.location}</span>
            </div>
          </header>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <GameRosterList gameId={gameId} onStatusChange={handleStatusChange} />
            </div>
            <div className="space-y-6">
              <AttendanceCard game={specificGame} userId={user.uid} onStatusChange={handleStatusChange} isCondensed />
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
          <h1 className="text-3xl font-headline mb-2">My Attendance</h1>
          <p className="text-muted-foreground">Confirm your availability for upcoming games and training.</p>
        </header>

        <div className="space-y-8 max-w-4xl">
          {isGamesLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted/50" />
            ))
          ) : !games || games.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <p className="text-muted-foreground">No upcoming events to confirm.</p>
            </Card>
          ) : (
            games.map((game) => (
              <AttendanceCard 
                key={game.id} 
                game={game} 
                userId={user.uid} 
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
  onStatusChange 
}: { 
  gameId: string;
  onStatusChange: (gameId: string, status: AttendanceStatus, targetPlayerId?: string) => void;
}) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
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

  const confirmedCount = attendanceDocs?.filter(a => a.status === 'Confirmed').length || 0;
  const declinedCount = attendanceDocs?.filter(a => a.status === 'Declined').length || 0;

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <Users className="h-5 w-5" />
          Squad Roster
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
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center font-bold",
                      player.team === 'A' ? "bg-primary/10 text-primary" : "bg-indigo-100 text-indigo-700"
                    )}>
                      {player.number || player.name[0]}
                    </div>
                    {player.isCaptain && (
                      <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full p-0.5 shadow-xs">
                        <Crown className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {player.name} 
                      {player.nickname && <span className="text-muted-foreground text-xs italic font-normal">"{player.nickname}"</span>}
                      {player.isCaptain && (
                        <Badge variant="secondary" className="bg-accent/20 text-accent text-[10px] font-bold h-4 px-1 leading-none uppercase tracking-wider">
                          Capt.
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className={cn(
                        "font-bold",
                        player.team === 'A' ? "text-primary" : "text-indigo-600"
                      )}>
                        Team {player.team}
                      </span>
                      {" • "}{player.preferredPositions?.join(', ') || 'Any'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={status === 'Confirmed' ? 'default' : status === 'Declined' ? 'destructive' : 'outline'}
                    className={cn(
                      "min-w-[90px] justify-center font-bold",
                      status === 'Confirmed' && "bg-accent hover:bg-accent",
                      status === 'Pending' && "border-amber-500 text-amber-600"
                    )}
                  >
                    {status}
                  </Badge>

                  {currentPlayer?.isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Manual Override</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onStatusChange(gameId, 'Confirmed', player.id)} className="text-accent font-bold">
                          <Check className="mr-2 h-4 w-4" /> Confirm
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(gameId, 'Declined', player.id)} className="text-destructive font-bold">
                          <X className="mr-2 h-4 w-4" /> Decline
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(gameId, 'Pending', player.id)} className="font-bold">
                          <Clock className="mr-2 h-4 w-4" /> Pending
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

function AttendanceCard({ game, userId, onStatusChange, isCondensed = false }: { game: Game, userId: string, onStatusChange: (id: string, s: AttendanceStatus) => void, isCondensed?: boolean }) {
  const firestore = useFirestore();
  const attendanceRef = useMemoFirebase(() => doc(firestore, "games", game.id, "attendanceRecords", userId), [firestore, game.id, userId]);
  const { data: attendance } = useDoc<any>(attendanceRef);
  
  const currentStatus: AttendanceStatus = attendance?.status || 'Pending';

  if (isCondensed) {
    return (
      <Card className="border-none shadow-lg overflow-hidden bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">My Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Currently:</span>
            <Badge className={cn(
              "font-bold",
              currentStatus === 'Confirmed' ? "bg-accent" : 
              currentStatus === 'Declined' ? "bg-destructive" : "bg-amber-500"
            )}>
              {currentStatus}
            </Badge>
          </div>
          <div className="grid gap-2">
            <Button 
              size="sm"
              onClick={() => onStatusChange(game.id, 'Confirmed')}
              className={cn(
                "w-full gap-2 transition-all font-bold",
                currentStatus === 'Confirmed' ? "bg-accent" : "bg-white text-foreground border hover:bg-accent/10"
              )}
            >
              <Check className="h-4 w-4" />
              Join
            </Button>
            <Button 
              size="sm"
              onClick={() => onStatusChange(game.id, 'Declined')}
              variant="outline"
              className={cn(
                "w-full gap-2 transition-all font-bold",
                currentStatus === 'Declined' ? "bg-destructive text-white" : "hover:bg-destructive/10"
              )}
            >
              <X className="h-4 w-4" />
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-none shadow-lg overflow-hidden transition-all",
      currentStatus === 'Confirmed' ? "ring-2 ring-accent bg-accent/5" : 
      currentStatus === 'Declined' ? "ring-2 ring-destructive bg-destructive/5" : ""
    )}>
      <CardHeader className="border-b bg-white/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/20 text-primary">
              {game.type}
            </Badge>
            <Badge 
              variant="outline"
              className={cn(
                "font-bold border-none text-white",
                game.team === 'A' ? "bg-primary" : 
                game.team === 'B' ? "bg-indigo-600" : 
                "bg-muted text-muted-foreground"
              )}
            >
              Team {game.team}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold">
            {currentStatus === 'Pending' ? (
              <span className="flex items-center text-amber-600">
                <Check className="h-4 w-4 mr-1 invisible" />
                Confirmation Required
              </span>
            ) : (
              <span className={cn(
                "flex items-center",
                currentStatus === 'Confirmed' ? "text-accent" : "text-destructive"
              )}>
                {currentStatus === 'Confirmed' ? <Check className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                {currentStatus}
              </span>
            )}
          </div>
        </div>
        <CardTitle className="text-2xl mt-4 font-headline">
          {game.type === 'Training' ? 'Team Training Session' : 
           game.type === 'Internal' ? 'Internal Squad Game' : 
           `Match vs ${game.opponent || 'TBD'}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="bg-primary/10 p-2 rounded-full">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Date</p>
              <p className="font-bold text-foreground">{new Date(game.date).toLocaleDateString('default', { dateStyle: 'full' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Time Window</p>
              <p className="font-bold text-foreground">{game.startTime} - {game.endTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="bg-primary/10 p-2 rounded-full">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Location</p>
              <p className="font-bold text-foreground">{game.location}</p>
            </div>
          </div>
          {game.kitColors && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="bg-accent/10 p-2 rounded-full">
                <Shirt className={cn("h-5 w-5", getKitColorClass(game.kitColors))} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Kit Selection</p>
                <p className={cn("font-bold", getKitColorClass(game.kitColors))}>{game.kitColors}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center items-center gap-4 bg-muted/20 p-6 rounded-xl border border-dashed text-foreground">
          <div className="font-bold text-center">Are you attending?</div>
          <div className="flex w-full gap-3">
            <Button 
              onClick={() => onStatusChange(game.id, 'Confirmed')}
              className={cn(
                "flex-1 gap-2 transition-all font-bold",
                currentStatus === 'Confirmed' ? "bg-accent scale-105" : "bg-white text-foreground border border-input hover:bg-accent/10 hover:border-accent"
              )}
            >
              <Check className="h-4 w-4" />
              Join
            </Button>
            <Button 
              onClick={() => onStatusChange(game.id, 'Declined')}
              variant="outline"
              className={cn(
                "flex-1 gap-2 transition-all font-bold",
                currentStatus === 'Declined' ? "bg-destructive text-white scale-105" : "bg-white text-foreground border border-input hover:bg-destructive/10 hover:border-destructive"
              )}
            >
              <X className="h-4 w-4" />
              Decline
            </Button>
          </div>
          <Link href={`/attendance?gameId=${game.id}`} className="text-xs text-primary font-bold hover:underline">
            View Full Squad Roster
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
