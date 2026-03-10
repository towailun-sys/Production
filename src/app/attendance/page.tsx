"use client";

import { useState, useEffect } from "react";
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
  AlertCircle
} from "lucide-react";
import { Game, AttendanceStatus, Attendance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getStoredGames, getStoredAttendance, saveStoredAttendance } from "@/lib/local-store";
import { useToast } from "@/hooks/use-toast";

export default function AttendancePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // For this local simulation, we'll assume current user ID is "currentUser"
  const currentUserId = "currentUser";

  useEffect(() => {
    setGames(getStoredGames());
    setAttendance(getStoredAttendance());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveStoredAttendance(attendance);
    }
  }, [attendance, isLoaded]);

  const handleStatusChange = (gameId: string, status: AttendanceStatus) => {
    const existing = attendance.findIndex(a => a.gameId === gameId && a.playerId === currentUserId);
    
    let newAttendance: Attendance[];
    if (existing !== -1) {
      newAttendance = attendance.map((a, i) => i === existing ? { ...a, status } : a);
    } else {
      newAttendance = [...attendance, { gameId, playerId: currentUserId, status }];
    }
    
    setAttendance(newAttendance);
    toast({
      title: status === 'Confirmed' ? "Availability Confirmed" : "Availability Declined",
      description: "Your status has been updated for this event.",
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-headline mb-2">My Attendance</h1>
          <p className="text-muted-foreground">Please confirm if you can make it to the upcoming team events.</p>
        </header>

        <div className="space-y-8 max-w-4xl">
          {games.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <p className="text-muted-foreground">No upcoming events to confirm.</p>
            </Card>
          ) : (
            games.map((game) => {
              const userAttendance = attendance.find(a => a.gameId === game.id && a.playerId === currentUserId);
              const currentStatus: AttendanceStatus = userAttendance?.status || 'Pending';
              
              return (
                <Card key={game.id} className={cn(
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
                      {game.type === 'Training' ? 'Team Training Session' : `Match vs ${game.opponent || 'TBD'}`}
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
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Kickoff</p>
                          <p className="font-medium text-foreground">{game.time}</p>
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
                    </div>

                    <div className="flex flex-col justify-center items-center gap-4 bg-muted/20 p-6 rounded-xl border border-dashed">
                      <p className="font-bold text-center">Are you attending?</p>
                      <div className="flex w-full gap-3">
                        <Button 
                          onClick={() => handleStatusChange(game.id, 'Confirmed')}
                          className={cn(
                            "flex-1 gap-2 transition-all",
                            currentStatus === 'Confirmed' ? "bg-accent scale-105" : "bg-white text-foreground border border-input hover:bg-accent/10 hover:border-accent"
                          )}
                        >
                          <Check className="h-4 w-4" />
                          I'm Going
                        </Button>
                        <Button 
                          onClick={() => handleStatusChange(game.id, 'Declined')}
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
            })
          )}
        </div>
      </main>
    </div>
  );
}
