
"use client";

import { MainNav } from "@/components/layout/main-nav";
import { useTranslation } from "@/components/language-provider";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Game, Attendance } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, CalendarDays, Banknote, UserRound, History, Loader2, Info, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { KitBadge } from "@/app/page";

export default function AttendancePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { dict, language } = useTranslation();

  // 1. Get user's confirmed attendance records from their personal collection
  const confirmedAttendanceQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, "users", user.uid, "game_attendances"),
      where("status", "==", "Confirmed")
    );
  }, [firestore, user]);

  const { data: attendanceRecords, isLoading: isAttendanceLoading } = useCollection<Attendance>(confirmedAttendanceQuery);

  // 2. Get all games to join with attendance data
  const gamesQuery = useMemoFirebase(() => {
    return query(collection(firestore, "games"), orderBy("date", "asc"));
  }, [firestore]);

  const { data: games, isLoading: isGamesLoading } = useCollection<Game>(gamesQuery);

  const confirmedGames = (games || []).filter(game => 
    attendanceRecords?.some(record => record.gameId === game.id)
  );

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const upcomingConfirmed = confirmedGames.filter(g => g.date >= todayStr);
  const pastConfirmed = confirmedGames.filter(g => g.date < todayStr);

  const formatGameDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'zh') {
      const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
    }
    return date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const renderGameCard = (game: Game, isOutdated: boolean) => (
    <Card 
      key={game.id} 
      className={cn(
        "border-none shadow-md border-l-4 rounded-2xl overflow-hidden mb-6 transition-all",
        isOutdated ? "border-muted-foreground opacity-60 grayscale bg-muted/20" : "border-primary"
      )}
    >
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn(
                  "font-bold px-2 py-0.5 border-none text-[10px] uppercase tracking-wider",
                  game.type === 'League' ? "bg-primary text-white" : 
                  game.type === 'Training' ? "bg-accent text-white" :
                  "bg-muted text-foreground"
                )}>
                  {dict.common.gameTypes[game.type] || game.type}
                </Badge>
                {isOutdated && (
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-none font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <History className="h-3 w-3" />
                    {dict.common.outdated}
                  </Badge>
                )}
              </div>
              <h3 className="text-lg md:text-xl font-headline font-bold leading-tight">
                {game.type === 'Training' || game.type === 'Internal' 
                  ? dict.common.gameTypes[game.type] 
                  : `${dict.common.matchVs} ${game.opponent || dict.common.tbd}`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  {formatGameDate(game.date)}
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  {game.startTime} - {game.endTime}
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  {game.location}
                </div>
                {game.coach && (
                  <div className="flex items-center gap-2.5">
                    <UserRound className="h-4 w-4 text-primary shrink-0" />
                    {game.coach}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <KitBadge kitId={game.kitColors} />
                  <KitBadge kitId={game.alternativeKitColors} isAlternative />
                </div>
              </div>
            </div>

            {game.fee && (
              <div className="flex items-start gap-2 text-[11px] font-bold p-3 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                <Banknote className="h-4 w-4 shrink-0" />
                <span className="whitespace-pre-wrap">{game.fee}</span>
              </div>
            )}

            {game.additionalDetails && (
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground mt-1 bg-muted/30 p-4 rounded-xl border border-dashed border-primary/20">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">{dict.attendance.detailsLabel}</div>
                  <p className="leading-relaxed whitespace-pre-wrap font-medium">{game.additionalDetails}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isUserLoading || isAttendanceLoading || isGamesLoading) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <MainNav />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">{dict.common.loading}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-headline mb-2">{dict.attendance.title}</h1>
          <p className="text-muted-foreground text-sm md:text-base">{dict.attendance.subtitle}</p>
        </header>

        {confirmedGames.length === 0 ? (
          <Card className="p-16 text-center border-dashed border-2 rounded-3xl">
            <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">{dict.attendance.noConfirmedFixtures}</p>
          </Card>
        ) : (
          <div className="space-y-12">
            {upcomingConfirmed.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-headline font-bold">{dict.games.upcoming}</h2>
                  <Badge className="bg-primary text-white font-bold">{upcomingConfirmed.length}</Badge>
                </div>
                {upcomingConfirmed.map(game => renderGameCard(game, false))}
              </section>
            )}

            {pastConfirmed.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 border-b pb-4 opacity-70">
                  <History className="h-6 w-6 text-muted-foreground" />
                  <h2 className="text-xl font-headline font-bold text-muted-foreground">{dict.games.outdated}</h2>
                  <Badge variant="outline" className="text-muted-foreground font-bold">{pastConfirmed.length}</Badge>
                </div>
                {pastConfirmed.map(game => renderGameCard(game, true))}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
