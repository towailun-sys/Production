
"use client";

import React, { useState, Fragment, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/layout/main-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Calendar, 
  MapPin, 
  Clock,
  ArrowRight,
  Trophy,
  Lock,
  Loader2,
  ShieldCheck,
  Database,
  UserRound,
  Sparkles,
  Check,
  X,
  Crown,
  Shirt,
  Banknote,
  Info,
  Image as ImageIcon,
  LogIn
} from "lucide-react";
import Link from "next/link";
import { Game, Player, Attendance, AttendanceStatus, Team, Kit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, useAuth } from "@/firebase";
import { collection, query, orderBy, limit, where, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useTranslation } from "@/components/language-provider";
import Image from "next/image";

const getColorHex = (name: string) => {
  const n = name.toLowerCase().trim();
  const mapping: Record<string, string> = {
    'pink': '#db2777', '粉紅': '#db2777',
    'grey': '#6b7280', 'gray': '#6b7280', '灰': '#6b7280',
    'red': '#ef4444', '紅': '#ef4444',
    'blue': '#3b82f6', '藍': '#3b82f6',
    'green': '#22c55e', '綠': '#22c55e',
    'yellow': '#eab308', '黃': '#eab308',
    'black': '#000000', '黑': '#000000',
    'white': '#94a3b8', '白': '#94a3b8',
    'orange': '#f97316', '橙': '#f97316',
    'purple': '#a855f7', '紫': '#a855f7',
    'navy': '#1e3a8a', '深藍': '#1e3a8a',
    'maroon': '#7f1d1d', '褐': '#7f1d1d',
    'gold': '#d4af37', '金': '#d4af37',
    'silver': '#c0c0c0', '銀': '#c0c0c0',
    'lime': '#84cc16', '青': '#84cc16',
    'teal': '#14b8a6', '藍綠': '#14b8a6',
    'cyan': '#06b6d4', '天藍': '#06b6d4',
    'brown': '#78350f', '啡': '#78350f', '棕': '#78350f'
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (n.includes(key)) return value;
  }
  return 'inherit';
};

export function KitColorText({ colorText, className }: { colorText: string | undefined, className?: string }) {
  if (!colorText) return null;
  
  const parts = colorText.split('/').map(p => p.trim());
  
  return (
    <span className={cn("bg-white/50 px-1 rounded", className)}>
      {parts.map((part, i) => (
        <Fragment key={i}>
          <span style={{ color: getColorHex(part) }}>{part}</span>
          {i < parts.length - 1 && <span className="mx-1 text-muted-foreground">/</span>}
        </Fragment>
      ))}
    </span>
  );
}

export function KitBadge({ kitId, isAlternative = false }: { kitId: string | null | undefined, isAlternative?: boolean }) {
  const firestore = useFirestore();
  const { dict, language } = useTranslation();
  
  const effectiveKitId = (!kitId || kitId === 'none') ? null : kitId;
  
  const kitRef = useMemoFirebase(() => {
    if (!effectiveKitId || effectiveKitId.includes('/')) return null;
    return doc(firestore, "kits", effectiveKitId);
  }, [firestore, effectiveKitId]);
  
  const { data: kit, isLoading } = useDoc<Kit>(kitRef);

  if (isLoading) return <div className="h-8 w-24 animate-pulse bg-muted rounded-full" />;
  
  if (kit) {
    const kitName = language === 'zh' ? kit.nameZh || kit.name : kit.name;
    const kitColor = language === 'zh' ? kit.colorZh || kit.color : kit.color;

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              "text-[10px] md:text-xs font-bold flex h-auto min-h-[32px] items-center gap-2 transition-all hover:bg-primary/10 active:scale-95 py-1.5 px-4", 
              "text-primary border-primary/30 rounded-full bg-white shadow-sm"
            )}
          >
            <Shirt className="h-3.5 w-3.5 shrink-0" />
            <div className="flex flex-wrap items-center gap-x-1.5 leading-none text-left">
              {isAlternative && <span className="text-[9px] uppercase tracking-wider opacity-70">ALT:</span>}
              <span>{kitName}</span>
              {kitColor && (
                <KitColorText 
                  colorText={kitColor} 
                  className="font-bold opacity-80" 
                />
              )}
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-3">
              <Shirt className="h-5 w-5 text-primary" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold uppercase tracking-widest">{dict.players.kits.viewImage}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {kitName} {' '} {kitColor && <KitColorText colorText={kitColor} className="ml-1" />}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden border bg-muted shadow-inner">
            {kit.imageUrl ? (
              <Image 
                src={kit.imageUrl} 
                alt={kitName} 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 450px"
                unoptimized={kit.imageUrl.startsWith('data:')}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <ImageIcon className="h-10 w-10 opacity-20" />
                <span className="text-xs font-medium">No image available</span>
              </div>
            )}
          </div>
          <div className="mt-6">
            <Button className="w-full font-bold h-12" variant="outline" asChild>
              <DialogTrigger>Close</DialogTrigger>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (effectiveKitId && effectiveKitId.length > 0 && effectiveKitId.length < 50) {
    return (
      <Badge 
        variant="outline" 
        className="text-[10px] md:text-xs font-bold flex items-center gap-1.5 opacity-60 py-1.5 px-3 h-auto"
      >
        <Shirt className="h-3.5 w-3.5" />
        {isAlternative && <span className="text-[9px] uppercase tracking-wider mr-1 opacity-70">ALT:</span>}
        {effectiveKitId}
      </Badge>
    );
  }

  if (!isAlternative) {
    return (
      <Badge 
        variant="outline" 
        className="text-[10px] md:text-xs font-bold opacity-30 py-1.5 px-3 h-auto border-dashed"
      >
        <Shirt className="h-3.5 w-3.5" />
        <span className="ml-1.5">{dict.common.tbd}</span>
      </Badge>
    );
  }

  return null;
}

function UserAttendanceToggle({ gameId, userId }: { gameId: string, userId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { dict } = useTranslation();
  
  const attendanceRef = useMemoFirebase(() => 
    doc(firestore, "games", gameId, "attendanceRecords", userId), 
    [firestore, gameId, userId]
  );
  const { data: attendance } = useDoc<Attendance>(attendanceRef);
  
  const currentStatus = attendance?.status || 'Pending';

  const updateStatus = (status: AttendanceStatus) => {
    const attendanceData = {
      id: userId,
      playerId: userId,
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
      title: status === 'Confirmed' ? dict.attendance.toasts.confirmDesc : dict.attendance.toasts.updateDesc,
    });
  };

  return (
    <div className="flex gap-2 w-full mt-4">
      <Button 
        size="sm" 
        variant={currentStatus === 'Confirmed' ? "default" : "outline"}
        className={cn(
          "flex-1 h-10 text-xs font-bold transition-all", 
          currentStatus === 'Confirmed' ? "bg-primary hover:bg-primary/90 border-primary text-white" : "hover:border-primary hover:text-primary"
        )}
        onClick={() => updateStatus('Confirmed')}
      >
        <Check className="h-4 w-4 mr-1.5" /> {dict.common.join}
      </Button>
      <Button 
        size="sm" 
        variant={currentStatus === 'Declined' ? "default" : "outline"}
        className={cn(
          "flex-1 h-10 text-xs font-bold transition-all",
          currentStatus === 'Declined' ? "bg-destructive hover:bg-destructive/90 border-destructive text-white" : "hover:border-destructive hover:text-destructive"
        )}
        onClick={() => updateStatus('Declined')}
      >
        <X className="h-4 w-4 mr-1.5" /> {dict.common.decline}
      </Button>
    </div>
  );
}

function GameAttendancePreview({ gameId, allPlayers, userId }: { gameId: string, allPlayers: Player[], userId: string | undefined }) {
  const firestore = useFirestore();
  const { dict } = useTranslation();
  
  const attendanceQuery = useMemoFirebase(() => {
    if (!userId) return null;
    return collection(firestore, "games", gameId, "attendanceRecords");
  }, [firestore, gameId, userId]);
  
  const { data: attendanceDocs, isLoading } = useCollection<Attendance>(attendanceQuery);

  if (isLoading) return <div className="h-4 w-24 animate-pulse bg-muted rounded mt-2" />;
  
  const confirmedPlayers = attendanceDocs
    ?.filter(a => a.status === 'Confirmed')
    .map(a => {
      if (a.isGuest) {
        return { id: a.id, name: a.guestName || "Guest", isGuest: true } as any;
      }
      return allPlayers.find(p => p.id === a.playerId);
    })
    .filter(Boolean) as any[] || [];

  if (confirmedPlayers.length === 0) {
    return <div className="text-[11px] text-muted-foreground italic mt-3">{dict.dashboard.noConfirmations}</div>;
  }

  return (
    <div className="mt-4 pt-3 border-t border-dashed">
      <div className="flex items-center gap-1.5 mb-2">
        <Check className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{dict.dashboard.confirmedSquad} ({confirmedPlayers.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {confirmedPlayers.map((p) => {
          const hasNumber = p.number !== undefined && p.number !== null;
          const positions = p.preferredPositions?.map((pos: any) => dict.common.positions[pos.toLowerCase() as keyof typeof dict.common.positions] || pos).join('/') || null;
          
          return (
            <Badge 
              key={p.id} 
              variant="secondary" 
              className={cn(
                "text-[10px] py-0.5 px-2 h-auto min-h-6 font-bold gap-1 flex flex-wrap",
                p.isGuest ? "bg-accent/10 text-accent border-accent/20" : "bg-primary/10 text-primary border-primary/20"
              )}
            >
              <div className="flex items-center gap-1">
                {p.isCaptain && <Crown className="h-3 w-3 text-accent" />}
                {hasNumber && <span className="opacity-60">#{p.number}</span>}
                <span>{p.nickname || p.name}</span>
                {p.isGuest && <span className="text-[8px] opacity-60 font-normal">({dict.attendance.guest})</span>}
              </div>
              {positions && !p.isGuest && (
                <span className="text-[8px] opacity-60 font-normal ml-0.5">
                  ({positions})
                </span>
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { language, dict } = useTranslation();
  
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClaimingAdmin, setIsClaimingAdmin] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFirstRunCheck, setIsFirstRunCheck] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      const playersRef = collection(firestore, "players");
      getDocs(query(playersRef, where("id", "!=", ""))).then(snapshot => {
        setIsFirstRunCheck(snapshot.empty);
      });
    } else if (!isUserLoading) {
      setIsFirstRunCheck(false);
    }
  }, [user, firestore, isUserLoading]);

  const playerRef = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user, isUserLoading]);
  const { data: currentPlayer, isLoading: isProfileLoading } = useDoc<Player>(playerRef);

  const emailMatchQuery = useMemoFirebase(() => {
    if (isUserLoading || !user || currentPlayer) return null;
    return query(collection(firestore, "players"), where("email", "==", user.email), limit(1));
  }, [firestore, user, currentPlayer, isUserLoading]);
  const { data: matchedProfiles, isLoading: isMatchedProfilesLoading } = useCollection<Player>(emailMatchQuery);
  const preEnteredProfile = matchedProfiles?.find(p => p.id !== user?.uid);

  const teamsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "teams");
  }, [firestore, user, isUserLoading]);
  const { data: teams } = useCollection<Team>(teamsQuery);

  const gamesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    return query(
      collection(firestore, "games"),
      where("date", ">=", todayStr),
      orderBy("date", "asc"),
      limit(30)
    );
  }, [firestore, user, isUserLoading]);

  const { data: upcomingGames, isLoading: isGamesLoading } = useCollection<Game>(gamesQuery);
  
  const playersQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "players");
  }, [firestore, user, isUserLoading]);
  
  const { data: players } = useCollection<Player>(playersQuery);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);

      if (result.user.email) {
        const playersRef = collection(firestore, "players");
        const q = query(playersRef, where("email", "==", result.user.email));
        const snapshot = await getDocs(q);

        const allPlayersSnapshot = await getDocs(query(playersRef, where("id", "!=", "")));
        const isFirstRun = allPlayersSnapshot.empty;

        if (snapshot.empty && !isFirstRun) {
          await signOut(auth);
          toast({
            variant: "destructive",
            title: dict.nav.unauthorizedEmailTitle,
            description: dict.nav.unauthorizedEmailDesc,
          });
          return;
        }
      }

      router.push('/');
      toast({
        title: language === 'zh' ? "登入成功" : "Signed in successfully",
        description: language === 'zh' ? `歡迎回到 ${dict.nav.title}。` : `Welcome back to ${dict.nav.title}.`,
      });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast({
          variant: "destructive",
          title: language === 'zh' ? "登入失敗" : "Sign in failed",
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleClaimProfile = () => {
    if (!user || !preEnteredProfile) return;
    setIsLinking(true);
    
    const newDocRef = doc(firestore, "players", user.uid);
    const oldDocRef = doc(firestore, "players", preEnteredProfile.id);
    
    const claimData = {
      ...preEnteredProfile,
      id: user.uid,
      email: user.email,
      isLinked: true 
    };

    setDoc(newDocRef, claimData)
      .then(() => {
        deleteDoc(oldDocRef).catch(() => {});
        toast({ title: "Profile Claimed!" });
      })
      .catch(async () => {})
      .finally(() => {
        setIsLinking(false);
      });
  };

  const handleClaimAdmin = () => {
    if (!user) return;
    setIsClaimingAdmin(true);
    
    const adminRef = doc(firestore, "players", user.uid);
    
    const adminData: Partial<Player> = {
      id: user.uid,
      isAdmin: true,
      isLinked: true
    };

    if (!currentPlayer) {
      Object.assign(adminData, {
        name: user.displayName || "Admin User",
        email: user.email || "",
        status: "Active",
        teams: [],
        preferredPositions: ["MF", "FW"],
        number: 10
      });
    }

    setDoc(adminRef, adminData, { merge: true })
      .then(() => {
        toast({ title: "Admin Rights Granted" });
      })
      .catch(async () => {})
      .finally(() => {
        setIsClaimingAdmin(false);
      });
  };

  const handleToggleAdminRole = () => {
    if (!user || !currentPlayer) return;
    const newAdminStatus = !currentPlayer.isAdmin;
    const playerRef = doc(firestore, "players", user.uid);
    setDoc(playerRef, { id: user.uid, isAdmin: newAdminStatus }, { merge: true });
    toast({ title: newAdminStatus ? "Admin Mode" : "Player Mode" });
  };

  const handleSeedData = () => {
    if (!user || !currentPlayer?.isAdmin) return;
    setIsSeeding(true);
    
    const sampleTeams = [
      { id: "team-a", name: "Team A", nameZh: "隊伍A" },
      { id: "team-b", name: "Team B", nameZh: "隊伍B" },
      { id: "team-camp3", name: "Team Camp 3", nameZh: "訓練營 3" }
    ];

    sampleTeams.forEach(t => {
      setDoc(doc(firestore, "teams", t.id), t);
    });

    const sampleKits = [
      { id: "kit-home-1", name: "Home 1", nameZh: "主場一", color: "Pink / Grey", colorZh: "粉紅 / 灰", imageUrl: "https://picsum.photos/seed/kit1/600/800" },
      { id: "kit-away-1", name: "Away 1", nameZh: "客場一", color: "Black / Black", colorZh: "全黑", imageUrl: "https://picsum.photos/seed/kit2/600/800" },
    ];

    sampleKits.forEach(k => {
      setDoc(doc(firestore, "kits", k.id), k);
    });

    const today = new Date().toISOString().split('T')[0];
    const in3Days = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

    const sampleGames = [
      { id: "seed-g1", date: today, startTime: "19:00", endTime: "21:00", location: "Central Sports Complex, Pitch 1", type: "League", team: "team-a", opponent: "Blue Arrows FC", coach: "Sir Alex", fee: "$100\nPayment via Bank Transfer", kitColors: "kit-home-1", alternativeKitColors: "kit-away-1", additionalDetails: "Please arrive 30 mins early for warm up." },
      { id: "seed-g2", date: in3Days, startTime: "18:30", endTime: "20:00", location: "Community Field A", type: "Training", team: "All", opponent: "N/A", coach: "Pep G", fee: "Free", kitColors: "kit-home-1", alternativeKitColors: "", additionalDetails: "Tactics session." },
    ];

    sampleGames.forEach(g => {
      setDoc(doc(firestore, "games", g.id), g);
    });

    const playerRef = doc(firestore, "players", user.uid);
    setDoc(playerRef, { 
      id: user.uid,
      teams: ["team-a", "team-b", "team-camp3"],
      status: "Active",
      number: (currentPlayer?.number !== undefined && currentPlayer?.number !== null) ? currentPlayer.number : 10
    }, { merge: true });

    toast({ title: "Seeding Complete", description: "Sample teams, kits, and games created." });
    setIsSeeding(false);
  };

  const formatGameDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'zh') {
      const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
    }
    return date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getTeamName = (teamId: string) => {
    if (teamId === 'All') return dict.common.teams.All;
    const team = teams?.find(t => t.id === teamId);
    if (!team) return teamId;
    return language === 'zh' ? team.nameZh : team.name;
  };

  // Block rendering until authorization status is confirmed
  const isAuthChecking = user && (isProfileLoading || isMatchedProfilesLoading || isFirstRunCheck === null);
  const isUnauthorizedFlashCheck = user && !currentPlayer && !preEnteredProfile && isFirstRunCheck === false;

  if (isUserLoading || isAuthChecking || isUnauthorizedFlashCheck) {
    return (
      <div className="min-h-screen bg-background pb-12 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <div className="text-muted-foreground font-medium">{dict.common.loading}</div>
      </div>
    );
  }

  const welcomeName = currentPlayer?.nickname || currentPlayer?.name || user?.displayName || dict.common.player;
  const filteredGames = upcomingGames?.filter(game => {
    if (currentPlayer?.isAdmin) return true;
    if (!currentPlayer) return false;
    return game.team === 'All' || currentPlayer.teams?.includes(game.team);
  }) || [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-headline tracking-tight">
              {user ? (language === 'zh' ? `${dict.dashboard.welcome}，${welcomeName}！` : `${dict.dashboard.welcome}, ${welcomeName}!`) : dict.nav.dashboard}
            </h1>
            <div className="text-muted-foreground font-medium text-sm md:text-base">{dict.dashboard.subtitle}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentPlayer?.isAdmin && (
              <>
                <Button variant="outline" size="sm" className="border-dashed border-primary text-primary hover:bg-primary/5 font-bold text-xs" onClick={handleSeedData}>
                  <Database className="mr-2 h-3.5 w-3.5" /> {dict.dashboard.seedData}
                </Button>
                <Button variant="outline" size="sm" className="border-dashed border-destructive text-destructive hover:bg-destructive/5 font-bold text-xs" onClick={handleToggleAdminRole}>
                  <UserRound className="mr-2 h-3.5 w-3.5" /> {dict.dashboard.testAsPlayer}
                </Button>
              </>
            )}
            {user && (!currentPlayer || !currentPlayer.isAdmin) && (
              <Button variant="outline" size="sm" className="border-dashed border-primary text-primary hover:bg-primary/5 font-bold text-xs" onClick={handleClaimAdmin} disabled={isClaimingAdmin}>
                {isClaimingAdmin ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-2 h-3.5 w-3.5" />}
                {dict.dashboard.claimAdmin}
              </Button>
            )}
          </div>
        </header>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-muted/20 rounded-3xl border border-dashed border-primary/20">
            <Lock className="h-10 w-10 text-primary mb-4" />
            <h2 className="text-xl md:text-2xl font-headline mb-2">{dict.attendance.signinRequired}</h2>
            <div className="text-muted-foreground text-sm max-w-sm">{dict.attendance.signinDesc}</div>
            <Button onClick={handleLogin} disabled={isLoggingIn} className="mt-6 bg-primary hover:bg-primary/90 gap-2 font-bold h-11 px-8 shadow-md rounded-xl">
              {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {dict.nav.signIn}
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-8">
              {!currentPlayer && preEnteredProfile && (
                <Card className="border-primary border-2 bg-primary/5 shadow-xl">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-primary text-lg md:text-xl"><Sparkles className="h-5 w-5 md:h-6 md:w-6" />{dict.dashboard.claimProfileTitle}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-foreground text-sm md:text-base font-medium">{dict.dashboard.claimProfileDesc(preEnteredProfile.name, preEnteredProfile.email || "")}</div>
                    <div className="p-4 bg-white rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold">{preEnteredProfile.name}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {preEnteredProfile.teams?.map(tId => (
                            <Badge key={tId} variant="outline" className="text-[10px] py-0 px-2 h-5">{getTeamName(tId)}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button onClick={handleClaimProfile} disabled={isLinking} className="bg-primary hover:bg-primary/90 gap-2 font-bold w-full sm:w-auto">
                        {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {dict.dashboard.claimProfileBtn}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                  <h2 className="text-xl md:text-2xl font-headline flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />{dict.nav.dashboard}
                    {currentPlayer && (
                      <Badge variant="outline" className="hidden sm:inline-flex ml-2 bg-primary/10 text-primary border-primary/20 font-bold">
                        {currentPlayer.isAdmin ? dict.dashboard.fullAccess : dict.dashboard.teamView(currentPlayer.teams?.length ? currentPlayer.teams?.map(getTeamName).join(', ') : dict.dashboard.noTeam)}
                      </Badge>
                    )}
                  </h2>
                </div>

                <div className="grid gap-6">
                  {isGamesLoading ? <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div> : filteredGames.length === 0 ? <Card className="p-12 text-center border-dashed border-2 text-muted-foreground">{dict.dashboard.noGames}</Card> : (
                    filteredGames.map((game) => (
                      <Card key={game.id} className="border-none shadow-md overflow-hidden border-l-4 border-primary transition-all active:scale-[0.98] sm:active:scale-100">
                        <CardContent className="p-0 flex flex-col md:flex-row">
                          <div className="p-5 md:p-6 flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge className="text-[10px] md:text-xs font-bold bg-primary text-white px-3 py-0.5 border-none">{getTeamName(game.team)}</Badge>
                              <Badge variant="outline" className={cn(
                                "font-bold px-2 py-0.5 border-none text-[10px] uppercase tracking-wider",
                                game.type === 'League' ? "bg-primary text-white" : 
                                game.type === 'Training' ? "bg-accent text-white" :
                                game.type === 'Internal' ? "bg-indigo-600 text-white" :
                                "bg-muted text-foreground"
                              )}>
                                {dict.common.gameTypes[game.type] || game.type}
                              </Badge>
                              <span className="text-xs md:text-sm font-bold text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{game.startTime} - {game.endTime}</span>
                              {game.coach && (
                                <span className="text-[10px] md:text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                  <UserRound className="h-3.5 w-3.5 text-primary" />
                                  {game.coach}
                                </span>
                              )}
                              <div className="flex flex-wrap gap-3">
                                <KitBadge kitId={game.kitColors} />
                                <KitBadge kitId={game.alternativeKitColors} isAlternative />
                              </div>
                              {game.additionalDetails && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 shrink-0">
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-4 shadow-xl">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-destructive uppercase tracking-widest">
                                        <Info className="h-3 w-3" /> {dict.attendance.detailsLabel}
                                      </div>
                                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                                        {game.additionalDetails}
                                      </p>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <h3 className="text-lg md:text-xl font-headline leading-tight">
                                {game.type === 'Training' || game.type === 'Internal' ? dict.common.gameTypes[game.type] : `${dict.common.matchVs} ${game.opponent || dict.common.tbd}`}
                              </h3>
                              <div className="grid gap-2 text-xs md:text-sm text-muted-foreground">
                                <div className="flex items-center gap-2.5"><Calendar className="h-4 w-4 text-primary shrink-0" />{formatGameDate(game.date)}</div>
                                <div className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-primary shrink-0" />{game.location}</div>
                              </div>
                            </div>

                            {game.fee && (
                              <div className="flex items-start gap-2 text-primary font-bold text-[11px] md:text-xs pt-1">
                                <Banknote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span className="whitespace-pre-wrap leading-normal">{game.fee}</span>
                              </div>
                            )}
                            
                            <GameAttendancePreview gameId={game.id} allPlayers={players || []} userId={user?.uid} />
                          </div>
                          <div className="bg-muted/30 p-5 md:p-6 md:w-80 border-t md:border-t-0 md:border-l flex flex-col justify-between gap-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{dict.attendance.attendingQuestion}</p>
                              <UserAttendanceToggle gameId={game.id} userId={user.uid} />
                            </div>
                            <Link href={`/attendance?gameId=${game.id}`} className="mt-2 sm:mt-0"><Button variant="outline" size="sm" className="w-full text-xs font-bold border-primary text-primary hover:bg-primary hover:text-white gap-2 h-10 md:h-9">{dict.dashboard.viewRoster}</Button></Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8 lg:sticky lg:top-24 h-fit">
              <Card className="border-primary/10 shadow-lg bg-primary/5">
                <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />{dict.dashboard.teammates}</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="divide-y max-h-[300px] lg:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {players?.map((p) => {
                      const hasNumber = p.number !== undefined && p.number !== null;
                      return (
                        <div key={p.id} className="py-2.5 flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px] border border-primary/10">
                            {hasNumber ? p.number : p.name[0]}
                          </div>
                          <div className="flex-1 text-xs font-bold truncate text-foreground/90">{p.nickname || p.name}</div>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
                            {p.teams?.map(tId => (
                              <Badge key={tId} variant="outline" className="text-[8px] h-4 px-1 bg-primary text-white border-none whitespace-nowrap">{getTeamName(tId)}</Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Link href="/players"><Button className="w-full bg-primary font-bold h-10">{dict.dashboard.viewPlayers}</Button></Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
