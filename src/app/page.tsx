import { MainNav } from "@/components/layout/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowRight,
  Trophy,
  Info
} from "lucide-react";
import Link from "next/link";
import { Game, Player, Attendance } from "@/lib/types";
import { cn } from "@/lib/utils";

// Mock data
const currentMonthGames: Game[] = [
  { id: "1", date: "2024-06-15", time: "19:00", location: "Central Sports Complex", type: "League", opponent: "Blue Arrows FC" },
  { id: "2", date: "2024-06-20", time: "18:30", location: "Community Field A", type: "Training" },
  { id: "3", date: "2024-06-27", time: "20:00", location: "Stadium Main Pitch", type: "Friendly", opponent: "Legends United" },
];

const players: Player[] = Array.from({ length: 15 }, (_, i) => ({
  id: `${i}`,
  name: i === 0 ? "David Miller" : i === 1 ? "Sam Jackson" : i === 2 ? "Marcus Rashford" : `Player ${i + 1}`,
  nickname: i === 0 ? "Miller" : i === 2 ? "Rashy" : undefined,
  preferredPosition: (['GK', 'DF', 'MF', 'FW'][i % 4]) as any
}));

// Mock attendance for multiple games
const attendanceData: Attendance[] = [
  // Game 1
  ...players.slice(0, 10).map(p => ({ gameId: "1", playerId: p.id, status: 'Confirmed' as const })),
  ...players.slice(10, 12).map(p => ({ gameId: "1", playerId: p.id, status: 'Declined' as const })),
  ...players.slice(12, 15).map(p => ({ gameId: "1", playerId: p.id, status: 'Pending' as const })),
  // Game 2
  ...players.slice(0, 8).map(p => ({ gameId: "2", playerId: p.id, status: 'Confirmed' as const })),
  ...players.slice(8, 15).map(p => ({ gameId: "2", playerId: p.id, status: 'Pending' as const })),
  // Game 3
  ...players.slice(0, 5).map(p => ({ gameId: "3", playerId: p.id, status: 'Confirmed' as const })),
  ...players.slice(5, 15).map(p => ({ gameId: "3", playerId: p.id, status: 'Pending' as const })),
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-headline mb-2">Team Dashboard</h1>
          <p className="text-muted-foreground font-medium">June 2024 Season Overview</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-headline flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  This Month's Fixtures
                </h2>
                <Link href="/games">
                  <Button variant="ghost" size="sm" className="text-primary gap-1">
                    Full Schedule <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-6">
                {currentMonthGames.map((game) => {
                  const gameAttendance = attendanceData.filter(a => a.gameId === game.id);
                  const confirmedPlayers = gameAttendance
                    .filter(a => a.status === 'Confirmed')
                    .map(a => players.find(p => p.id === a.playerId))
                    .filter((p): p is Player => !!p);
                  
                  const confirmedCount = confirmedPlayers.length;
                  const totalExpected = 11; // Standard team size

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
                                {game.time}
                              </span>
                            </div>
                            
                            <h3 className="text-xl font-headline mb-4">
                              {game.type === 'Training' ? 'Team Training Session' : `vs ${game.opponent}`}
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
                                        <p>{player.name} ({player.preferredPosition})</p>
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
                })}
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
                  <span className="font-bold">52</span>
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
                  <p className="font-bold text-foreground mb-1">Kit Colors</p>
                  <p>Home: Blue/White</p>
                  <p>Away: Total Black</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
