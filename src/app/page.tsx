import { MainNav } from "@/components/layout/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowRight,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { Game, Player, Attendance } from "@/lib/types";

// Mock data
const nextGame: Game = {
  id: "1",
  date: "2024-06-15",
  time: "19:00",
  location: "Central Sports Complex",
  type: "League",
  opponent: "Blue Arrows FC"
};

const players: Player[] = Array.from({ length: 12 }, (_, i) => ({
  id: `${i}`,
  name: `Player ${i + 1}`,
  nickname: i % 3 === 0 ? "Champ" : undefined,
  preferredPosition: (['GK', 'DF', 'MF', 'FW'][i % 4]) as any
}));

const attendance: Attendance[] = players.map((p, i) => ({
  gameId: "1",
  playerId: p.id,
  status: i < 8 ? 'Confirmed' : i < 10 ? 'Declined' : 'Pending'
}));

export default function DashboardPage() {
  const confirmedCount = attendance.filter(a => a.status === 'Confirmed').length;
  const declinedCount = attendance.filter(a => a.status === 'Declined').length;
  const pendingCount = attendance.filter(a => a.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-headline mb-2">Team Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Captain! Here's the squad status for the next game.</p>
        </header>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Next Game Card */}
          <Card className="md:col-span-2 border-primary/10 shadow-lg overflow-hidden border-l-4 border-l-primary">
            <div className="bg-primary/5 p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3">
                  NEXT MATCH
                </Badge>
                <span className="flex items-center text-sm font-medium text-primary">
                  <Clock className="mr-1 h-4 w-4" />
                  Starts in 3 days
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-headline mb-2">{nextGame.type}: vs {nextGame.opponent}</h2>
              <div className="flex flex-wrap gap-4 text-muted-foreground mt-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  {nextGame.date}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  {nextGame.time}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {nextGame.location}
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-6 bg-accent/5">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold font-headline text-accent">{confirmedCount}</p>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Going</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold font-headline text-destructive">{declinedCount}</p>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Out</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold font-headline text-muted-foreground">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pending</p>
                  </div>
                </div>
                <Link href="/games">
                  <Button variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary hover:text-white">
                    Manage Match
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="border-accent/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Squad Overview</CardTitle>
              <CardDescription>Quick glance at team health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Total Players</span>
                </div>
                <span className="font-bold">52</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-accent/10 p-2 rounded-full">
                    <Trophy className="h-5 w-5 text-accent" />
                  </div>
                  <span className="font-medium">Active Season</span>
                </div>
                <span className="font-bold">2024 Winter</span>
              </div>
              <div className="pt-4">
                <Link href="/players">
                  <Button className="w-full bg-accent hover:bg-accent/90">
                    Manage Squad
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Attendance Feed */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-headline">Recent Attendance</h3>
            <Link href="/attendance" className="text-primary hover:underline text-sm font-medium">View all</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {players.slice(0, 4).map((player, idx) => {
              const status = idx === 3 ? 'Pending' : idx % 2 === 0 ? 'Confirmed' : 'Declined';
              return (
                <Card key={player.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground uppercase">
                      {player.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.nickname || player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.preferredPosition}</p>
                    </div>
                    {status === 'Confirmed' ? (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    ) : status === 'Declined' ? (
                      <XCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
