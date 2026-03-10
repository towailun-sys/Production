"use client";

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
  AlertCircle,
  Shirt,
  Lock
} from "lucide-react";
import { Game, AttendanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";

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
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const gamesQuery = useMemoFirebase(() => query(collection(firestore, "games"), orderBy("date", "asc")), [firestore]);
  const { data: games, isLoading: isGamesLoading } = useCollection<Game>(gamesQuery);

  const handleStatusChange = (gameId: string, status: AttendanceStatus) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to register your attendance.",
      });
      return;
    }

    const attendanceRef = doc(firestore, "games", gameId, "attendanceRecords", user.uid);
    
    setDoc(attendanceRef, {
      id: user.uid,
      playerId: user.uid,
      gameId: gameId,
      status: status,
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    toast({
      title: status === 'Confirmed' ? "Availability Confirmed" : "Availability Declined",
      description: "Your status has been updated for this event.",
    });
  };

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

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-headline mb-2">My Attendance</h1>
          <p className="text-muted-foreground">Confirm your availability for {user.displayName}'s upcoming games.</p>
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

function AttendanceCard({ game, userId, onStatusChange }: { game: Game, userId: string, onStatusChange: (id: string, s: AttendanceStatus) => void }) {
  const firestore = useFirestore();
  const attendanceRef = useMemoFirebase(() => doc(firestore, "games", game.id, "attendanceRecords", userId), [firestore, game.id, userId]);
  const { data: attendance } = useDoc<any>(attendanceRef);
  
  const currentStatus: AttendanceStatus = attendance?.status || 'Pending';

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
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            {currentStatus === 'Pending' ? (
              <span className="flex items-center text-amber-600">
                <AlertCircle className="h-4 w-4 mr-1" />
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
              <p className="font-medium text-foreground">{new Date(game.date).toLocaleDateString('default', { dateStyle: 'full' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Time Window</p>
              <p className="font-medium text-foreground">{game.startTime} - {game.endTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="bg-primary/10 p-2 rounded-full">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Location</p>
              <p className="font-medium text-foreground">{game.location}</p>
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
          <p className="font-bold text-center">Are you attending?</p>
          <div className="flex w-full gap-3">
            <Button 
              onClick={() => onStatusChange(game.id, 'Confirmed')}
              className={cn(
                "flex-1 gap-2 transition-all",
                currentStatus === 'Confirmed' ? "bg-accent scale-105" : "bg-white text-foreground border border-input hover:bg-accent/10 hover:border-accent"
              )}
            >
              <Check className="h-4 w-4" />
              I'm Going
            </Button>
            <Button 
              onClick={() => onStatusChange(game.id, 'Declined')}
              variant="outline"
              className={cn(
                "flex-1 gap-2 transition-all",
                currentStatus === 'Declined' ? "bg-destructive text-white scale-105" : "bg-white text-foreground border border-input hover:bg-destructive/10 hover:border-destructive"
              )}
            >
              <X className="h-4 w-4" />
              Can't Make It
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
