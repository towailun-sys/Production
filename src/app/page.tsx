
"use client";

import { useState } from "react";
import { MainNav } from "@/components/layout/main-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Clock,
  ArrowRight,
  Trophy,
  Info,
  Shirt,
  Lock,
  Loader2,
  ShieldCheck,
  Users,
  Database,
  UserCheck,
  Fingerprint,
  Copy,
  Sparkles,
  Check
} from "lucide-react";
import Link from "next/link";
import { Game, Player, TeamType, Attendance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, where, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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

function GameAttendancePreview({ gameId, allPlayers }: { gameId: string, allPlayers: Player[] }) {
  const firestore = useFirestore();
  const attendanceQuery = useMemoFirebase(() => 
    collection(firestore, "games", gameId, "attendanceRecords"), 
    [firestore, gameId]
  );
  const { data: attendanceDocs, isLoading } = useCollection<Attendance>(attendanceQuery);

  if (isLoading) return <div className="h-4 w-24 animate-pulse bg-muted rounded mt-2" />;
  
  const confirmedPlayerIds = attendanceDocs
    ?.filter(a => a.status === 'Confirmed')
    .map(a => a.playerId) || [];

  if (confirmedPlayerIds.length === 0) {
    return <p className="text-[10px] text-muted-foreground italic mt-2">No confirmations yet.</p>;
  }

  const confirmedNicknames = confirmedPlayerIds
    .map(id => {
      const p = allPlayers.find(player => player.id === id);
      return p?.nickname || p?.name || "Unknown";
    });

  return (
    <div className="mt-4 pt-3 border-t border-dashed">
      <div className="flex items-center gap-1.5 mb-2">
        <Check className="h-3 w-3 text-accent" />
        <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Confirmed Squad ({confirmedNicknames.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {confirmedNicknames.map((nick, idx) => (
          <Badge 
            key={idx} 
            variant="secondary" 
            className="text-[9px] py-0 px-2 h-5 bg-accent/10 text-accent border-accent/20 font-medium"
          >
            {nick}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClaimingAdmin, setIsClaimingAdmin] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Get current player profile by UID
  const playerRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user]);
  const { data: currentPlayer, isLoading: isProfileLoading } = useDoc<Player>(playerRef);

  // Search for matching pre-entered profile by Email
  const emailMatchQuery = useMemoFirebase(() => {
    if (!user || currentPlayer) return null;
    return query(collection(firestore, "players"), where("email", "==", user.email), limit(1));
  }, [firestore, user, currentPlayer]);
  const { data: matchedProfiles } = useCollection<Player>(emailMatchQuery);
  const preEnteredProfile = matchedProfiles?.[0];

  // Query games
  const gamesQuery = useMemoFirebase(() => {
    if (!user) return null;
    const now = new Date().toISOString().split('T')[0];
    
    return query(
      collection(firestore, "games"),
      where("date", ">=", now),
      orderBy("date", "asc"),
      limit(5)
    );
  }, [firestore, user]);

  const { data: upcomingGames, isLoading: isGamesLoading } = useCollection<Game>(gamesQuery);
  
  const playersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "players");
  }, [firestore, user]);
  
  const { data: players } = useCollection<Player>(playersQuery);

  const handleClaimProfile = async () => {
    if (!user || !preEnteredProfile) return;
    setIsLinking(true);
    try {
      const newDocRef = doc(firestore, "players", user.uid);
      await setDoc(newDocRef, {
        ...preEnteredProfile,
        id: user.uid,
        email: user.email 
      });

      const oldDocRef = doc(firestore, "players", preEnteredProfile.id);
      await deleteDoc(oldDocRef);

      toast({
        title: "Profile Claimed!",
        description: `Welcome to the squad, ${preEnteredProfile.nickname || preEnteredProfile.name}.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Claim Failed",
        description: "Could not link your profile.",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "ID Copied",
      description: "Your User ID has been copied to clipboard.",
    });
  };

  const handleClaimAdmin = async () => {
    if (!user) return;
    setIsClaimingAdmin(true);
    try {
      await setDoc(doc(firestore, "players", user.uid), {
        id: user.uid,
        name: user.displayName || "Admin User",
        email: user.email || "",
        isAdmin: true,
        status: "Active",
        team: "A",
        preferredPositions: []
      }, { merge: true });

      toast({
        title: "Admin Rights Granted",
        description: "You now have administrative access to manage the squad.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Could not grant admin rights.",
      });
    } finally {
      setIsClaimingAdmin(false);
    }
  };

  const handleSeedData = async () => {
    if (!user || !currentPlayer?.isAdmin) return;
    setIsSeeding(true);
    
    const sampleGames = [
      { id: "seed-g1", date: new Date().toISOString().split('T')[0], startTime: "19:00", endTime: "21:00", location: "Central Sports Complex", type: "League", team: "A", opponent: "Blue Arrows FC", kitColors: "Home 1: Pink/Grey" },
      { id: "seed-g2", date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], startTime: "18:30", endTime: "20:00", location: "Community Field A", type: "Training", team: "All", opponent: "N/A", kitColors: "Home 2: New White / New White" },
      { id: "seed-g3", date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], startTime: "20:00", endTime: "22:00", location: "Power League North", type: "Internal", team: "B", opponent: "N/A", kitColors: "Away 1: Black/Black" },
    ];

    try {
      for (const g of sampleGames) {
        await setDoc(doc(firestore, "games", g.id), g);
      }

      toast({
        title: "Database Seeded",
        description: "Sample fixtures and teammates have been added.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: "Could not populate database.",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <MainNav />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Loading squad data...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-headline mb-2">
              {user ? `Welcome back, ${currentPlayer?.nickname || currentPlayer?.name || user.displayName}!` : "Team Dashboard"}
            </h1>
            <p className="text-muted-foreground font-medium">
              {user ? "Your personalized squad overview and upcoming fixtures." : "Squad Status & Upcoming Schedule"}
            </p>
          </div>
          <div className="flex gap-2">
            {currentPlayer?.isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isSeeding}
                className="border-dashed border-accent text-accent hover:bg-accent/5"
                onClick={handleSeedData}
              >
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                Seed Sample Data
              </Button>
            )}
            {(!currentPlayer || !currentPlayer.isAdmin) && user && (
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isClaimingAdmin}
                className="border-dashed border-primary text-primary hover:bg-primary/5"
                onClick={handleClaimAdmin}
              >
                {isClaimingAdmin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Claim Admin Rights
              </Button>
            )}
          </div>
        </header>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-3xl border border-dashed border-primary/20">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-headline mb-2">Private Squad Access</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              Please sign in with your Google account to view the team schedule and register for games.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-8">
              {!currentPlayer && preEnteredProfile ? (
                <Card className="border-accent border-2 bg-accent/5 shadow-xl animate-in zoom-in-95 duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-accent">
                      <Sparkles className="h-6 w-6" />
                      We found your profile!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-foreground font-medium">
                      Hello {user.displayName}! An administrator has already created a squad profile for <strong>{preEnteredProfile.name}</strong> ({preEnteredProfile.email}). 
                    </p>
                    <div className="p-4 bg-white rounded-lg border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{preEnteredProfile.name} {preEnteredProfile.nickname && `"${preEnteredProfile.nickname}"`}</p>
                        <p className="text-xs text-muted-foreground">Team {preEnteredProfile.team} • {preEnteredProfile.status}</p>
                      </div>
                      <Button onClick={handleClaimProfile} disabled={isLinking} className="bg-accent hover:bg-accent/90 gap-2">
                        {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                        This is Me! Claim Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : !currentPlayer && (
                <Card className="border-amber-200 bg-amber-50 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <UserCheck className="h-6 w-6" />
                      Profile Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-amber-700">
                      Hello, {user.displayName}! Your account is not yet assigned to a squad. 
                      Please provide your User ID to the Team Administrator so they can link your account to a squad profile.
                    </p>
                    <div className="flex items-center justify-between p-3 bg-white/50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Fingerprint className="h-4 w-4 text-amber-600 shrink-0" />
                        <code className="text-xs font-mono text-amber-900 truncate">{user.uid}</code>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-1.5 text-amber-700 hover:bg-amber-100"
                        onClick={() => copyToClipboard(user.uid)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy ID
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-headline flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    Upcoming Fixtures
                    {currentPlayer && (
                      <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                        {currentPlayer.isAdmin ? "All Squads (Admin View)" : `Team ${currentPlayer.team}`}
                      </Badge>
                    )}
                  </h2>
                  <Link href="/games">
                    <Button variant="ghost" size="sm" className="text-primary gap-1">
                      Full Schedule <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="grid gap-6">
                  {isGamesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="h-40 animate-pulse bg-muted/50" />
                    ))
                  ) : !upcomingGames || upcomingGames.length === 0 ? (
                    <Card className="p-12 text-center border-dashed border-2">
                      <p className="text-muted-foreground">No upcoming games scheduled.</p>
                    </Card>
                  ) : (
                    upcomingGames
                      .filter(g => !currentPlayer || currentPlayer.isAdmin || g.team === 'All' || g.team === currentPlayer.team)
                      .map((game) => (
                      <Card key={game.id} className="border-none shadow-md hover:shadow-lg transition-all overflow-hidden border-l-4 border-primary">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="p-6 flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <Badge variant={game.type === 'League' ? 'default' : 'secondary'} className="rounded-md">
                                  {game.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs font-bold uppercase">
                                  Team {game.team}
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

                              <GameAttendancePreview gameId={game.id} allPlayers={players || []} />
                            </div>

                            <div className="bg-muted/30 p-6 md:w-80 border-t md:border-t-0 md:border-l flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Squad Management</p>
                                  <Badge variant="outline" className="text-accent border-accent/20 bg-accent/5">
                                    Active
                                  </Badge>
                                </div>
                                <p className="text-xs italic text-muted-foreground mb-4">
                                  {currentPlayer?.isAdmin ? "Manage full squad attendance and roster." : "Register and check who else is going."}
                                </p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Link href={`/attendance?gameId=${game.id}`} className="w-full">
                                  <Button variant="outline" size="sm" className="w-full text-xs font-bold border-primary text-primary hover:bg-primary hover:text-white gap-2">
                                    <Users className="h-3 w-3" />
                                    {currentPlayer?.isAdmin ? "Manage Roster" : "Squad Roster"}
                                  </Button>
                                </Link>
                                <Link href="/attendance" className="w-full">
                                  <Button variant="ghost" size="sm" className="w-full text-xs font-bold gap-2 text-muted-foreground">
                                    <UserCheck className="h-3 w-3" />
                                    Register
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <Card className="border-accent/10 shadow-lg bg-accent/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    Squad Teammates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="divide-y max-h-[400px] overflow-auto pr-2">
                    {players?.map((p) => (
                      <div key={p.id} className="py-2 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 text-[10px] flex items-center justify-center font-bold text-primary shrink-0">
                          {p.name[0]}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{p.status}</span>
                        </div>
                        {p.team && <Badge variant="outline" className="ml-auto text-[8px] h-4 px-1 shrink-0">T{p.team}</Badge>}
                      </div>
                    ))}
                    {(!players || players.length === 0) && (
                      <p className="text-xs text-muted-foreground italic py-4">No teammates assigned yet.</p>
                    )}
                  </div>
                  <div className="pt-4 border-t">
                    <Link href="/players">
                      <Button className="w-full bg-accent hover:bg-accent/90 shadow-md">
                        {currentPlayer?.isAdmin ? "Manage All Players" : "View Full Squad"}
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
                  <p>Check the squad roster for each game to see who is confirmed. Aim for 11+ players for match days!</p>
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <p className="font-bold text-foreground mb-1 text-xs">STANDARD KITS</p>
                    <p className="text-pink-500 font-medium text-[10px]">Home 1: Pink/Grey</p>
                    <p className="text-slate-400 font-medium text-[10px]">Home 2: New White</p>
                    <p className="text-slate-900 font-medium text-[10px]">Away 1: Black/Black</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
