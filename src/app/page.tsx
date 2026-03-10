
"use client";

import { useState, useEffect } from "react";
import { MainNav } from "@/components/layout/main-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Calendar, 
  MapPin, 
  Clock,
  ArrowRight,
  Trophy,
  Info,
  Shirt
} from "lucide-react";
import Link from "next/link";
import { Game, Player, Attendance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getStoredPlayers, getStoredGames, getStoredAttendance } from "@/lib/local-store";

const KIT_MAP: Record<string, string> = {
  "Home 1: Pink/Grey": "text-pink-500",
  "Home 2: White/White": "text-slate-400",
  "Away 1: Black/Black": "text-slate-900",
  "Away 2: White/White": "text-slate-400",
  "TBD": "text-muted-foreground"
};

const getKitColorClass = (kitLabel: string) => {
  return KIT_MAP[kitLabel] || "text-muted-foreground";
};

export default function DashboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPlayers(getStoredPlayers());
    setGames(getStoredGames());
    setAttendance(getStoredAttendance());
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingGames = games
    .filter(game => new Date(game.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-headline mb-2">Team Dashboard</h1>
          <p className="text-muted-foreground font-medium">
            Squad Status & Upcoming Schedule
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-headline flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  Upcoming Fixtures
                </h2>
                <Link href="/games">
                  <Button variant="ghost" size="sm" className="text-primary gap-1">
                    Full Schedule <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-6">
                {upcomingGames.length === 0 ? (
                  <Card className="p-12 text-center border-dashed border-2">
                    <p className="text-muted-foreground">No upcoming games scheduled.</p>
                  </Card>
                ) : (
                  upcomingGames.map((game) => {
                    const gameAttendance = attendance.filter(a => a.gameId === game.id);
                    const confirmedPlayers = gameAttendance
                      .filter(a => a.status === 'Confirmed')
                      .map(a => players.find(p => p.id === a.playerId))
                      .filter((p): p is Player => !!p);
                    
                    const confirmedCount = confirmedPlayers.length;
                    const totalExpected = 11;

                    return (
                      <Card key={game.id} className="border-none shadow-md hover:shadow-lg transition-all overflow-hidden border-l-4 border-primary">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="p-6 flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <Badge variant={game.type === 'League' ? 'default' : 'secondary'} className="rounded-md">
                                  {game.type}
                                </Badge>
                                <span className="text-sm font-bold text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {game.startTime} - {game.endTime}
                                </span>
                              </div>
                              
                              <h3 className="text-xl font-headline mb-4">
                                {game.type === 'Training' ? 'Team Training Session' : 
                                 game.type === 'Internal' ? 'Internal Squad Game' : 
                                 `vs ${game.opponent || 'TBD'}`}
                              </h3>

                              <div className="grid gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  {new Date(game.date).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  {game.location}
                                </div>
                                {game.kitColors && (
                                  <div className={cn("flex items-center gap-2 font-bold", getKitColorClass(game.kitColors))}>
                                    <Shirt className="h-4 w-4" />
                                    Kit: {game.kitColors}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="bg-muted/30 p-6 md:w-80 border-t md:border-t-0 md:border-l flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Availability</p>
                                  <Badge variant="outline" className={cn(
                                    "font-bold",
                                    confirmedCount >= totalExpected ? "border-accent text-accent bg-accent/5" : "text-amber-600 border-amber-200 bg-amber-50"
                                  )}>
                                    {confirmedCount} / {totalExpected} Min
                                  </Badge>
                                </div>

                                <div className="flex -space-x-2 overflow-hidden mb-4">
                                  <TooltipProvider>
                                    {confirmedPlayers.slice(0, 8).map((player) => (
                                      <Tooltip key={player.id}>
                                        <TooltipTrigger asChild>
                                          <Avatar className="border-2 border-background h-8 w-8 ring-1 ring-muted">
                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                              {player.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                          </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="text-xs">
                                            <p className="font-bold">{player.name} <span className="opacity-70">(Team {player.team})</span></p>
                                            <p className="text-muted-foreground">{player.preferredPositions.join(', ')}</p>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </TooltipProvider>
                                  {confirmedCount > 8 && (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold ring-1 ring-muted">
                                      +{confirmedCount - 8}
                                    </div>
                                  )}
                                  {confirmedCount === 0 && (
                                    <p className="text-xs italic text-muted-foreground">No confirmations yet</p>
                                  )}
                                </div>
                              </div>

                              <Link href="/attendance" className="w-full">
                                <Button variant="outline" size="sm" className="w-full text-xs font-bold border-primary text-primary hover:bg-primary hover:text-white">
                                  Update My Status
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <Card className="border-accent/10 shadow-lg bg-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  Squad Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Players</span>
                  <span className="font-bold">{players.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Attendance</span>
                  <span className="font-bold text-accent">84%</span>
                </div>
                <div className="pt-4">
                  <Link href="/players">
                    <Button className="w-full bg-accent hover:bg-accent/90 shadow-md">
                      Manage Squad
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-4">
                <p>Ensure you update your status at least 48 hours before kickoff to help the Gaffer plan the lineup.</p>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="font-bold text-foreground mb-1">Standard Kit Rules</p>
                  <p>Home 1: Pink shirt with grey short</p>
                  <p>Away 1: Black shirt with Black short</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
