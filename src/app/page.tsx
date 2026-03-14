
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
  Lock,
  Loader2,
  ShieldCheck,
  Database,
  UserRound,
  Sparkles,
  Crown,
  Shirt,
  Banknote,
  Info,
  ImageIcon,
  LogIn,
  Fingerprint,
  Copy,
  Users,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Game, Player, Team, Kit, Attendance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, useAuth } from "@/firebase";
import { collection, query, orderBy, limit, where, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/components/language-provider";
import Image from "next/image";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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

export function GameAttendanceSection({ 
  game, 
  user, 
  allPlayers,
  readOnly = false
}: { 
  game: Game; 
  user: any; 
  allPlayers: Player[] | null;
  readOnly?: boolean;
}) {
  const firestore = useFirestore();
  const { dict } = useTranslation();
  const { toast } = useToast();

  const attendanceQuery = useMemoFirebase(() => {
    return collection(firestore, "games", game.id, "attendanceRecords");
  }, [firestore, game.id]);
  const { data: attendanceRecords, isLoading } = useCollection<Attendance>(attendanceQuery);

  const myRecord = user ? (attendanceRecords?.find(r => r.id === user.uid) || null) : null;
  const confirmedRecords = attendanceRecords?.filter(r => r.status === 'Confirmed') || [];

  const handleUpdateStatus = (status: 'Confirmed' | 'Declined') => {
    if (!user) {
      toast({
        variant: "destructive",
        title: dict.attendance.signinRequired,
      });
      return;
    }

    const recordRef = doc(firestore, "games", game.id, "attendanceRecords", user.uid);
    const userRecordRef = doc(firestore, "users", user.uid, "game_attendances", game.id);

    const data = {
      id: user.uid,
      gameId: game.id,
      playerId: user.uid,
      status: status,
      lastUpdated: new Date().toISOString()
    };
    
    setDoc(recordRef, data, { merge: true }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: recordRef.path,
        operation: 'write',
        requestResourceData: data
      } satisfies SecurityRuleContext));
    });

    setDoc(userRecordRef, data, { merge: true }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRecordRef.path,
        operation: 'write',
        requestResourceData: data
      } satisfies SecurityRuleContext));
    });

    toast({
      title: status === 'Confirmed' ? dict.attendance.toasts.statusUpdated : dict.attendance.toasts.updateDesc,
      description: status === 'Confirmed' ? dict.attendance.toasts.confirmDesc : dict.attendance.toasts.statusDesc(status),
    });
  };

  if (isLoading) return <div className="h-20 w-full animate-pulse bg-muted rounded-xl mt-4" />;

  return (
    <div className="mt-6 space-y-4 pt-6 border-t border-dashed">
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant={myRecord?.status === 'Confirmed' ? 'default' : 'outline'} className={cn(
              "h-10 px-4 font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95",
              myRecord?.status === 'Confirmed' ? "bg-primary text-white shadow-md" : "border-primary/20 text-muted-foreground"
            )} onClick={() => handleUpdateStatus('Confirmed')}>
              <CheckCircle2 className="h-4 w-4" />
              {dict.common.join}
            </Badge>
            <Badge variant={myRecord?.status === 'Declined' ? 'destructive' : 'outline'} className={cn(
              "h-10 px-4 font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95",
              myRecord?.status === 'Declined' ? "bg-destructive text-white shadow-md" : "border-destructive/20 text-muted-foreground"
            )} onClick={() => handleUpdateStatus('Declined')}>
              <XCircle className="h-4 w-4" />
              {dict.common.decline}
            </Badge>
          </div>
        </div>
      )}

      <div className="bg-primary/5 rounded-2xl overflow-hidden">
        <div className="py-3 px-5 border-b border-primary/10 flex items-center justify-between">
          <div className="text-xs font-bold flex items-center gap-2 text-primary uppercase tracking-widest">
            <Users className="h-4 w-4" />
            {dict.dashboard.confirmedSquad}
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary font-bold text-[10px]">
            {confirmedRecords.length}
          </Badge>
        </div>
        
        {confirmedRecords.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-xs italic">
            {dict.dashboard.noConfirmations}
          </div>
        ) : (
          <div className="p-4 flex flex-wrap gap-2">
            {confirmedRecords.map((record) => {
              const p = allPlayers?.find(player => player.id === record.playerId);
              if (!p) return null;
              
              const posStr = p.preferredPositions?.join('/') || '';
              const numberStr = (p.number !== undefined && p.number !== null) ? `#${p.number}` : '';
              
              return (
                <Badge 
                  key={record.id} 
                  variant="outline" 
                  className="h-8 px-3 font-bold bg-white text-foreground border-primary/20 shadow-sm hover:bg-primary/5 transition-colors rounded-lg flex items-center gap-1.5"
                >
                  {p.isCaptain && <Crown className="h-3 w-3 text-accent shrink-0" />}
                  {numberStr && <span className="text-primary font-bold">{numberStr}</span>}
                  <span className="truncate max-w-[120px]">{p.nickname || p.name}</span>
                  {posStr && <span className="text-[10px] text-muted-foreground font-medium">({posStr})</span>}
                </Badge>
              );
            })}
          </div>
        )}
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
      getDocs(query(playersRef, limit(1)))
        .then(snapshot => {
          setIsFirstRunCheck(snapshot.empty);
        })
        .catch(() => {
          setIsFirstRunCheck(false);
        });
    } else if (!isUserLoading) {
      setIsFirstRunCheck(false);
    }
  }, [user, firestore, isUserLoading]);

  const playerRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user]);
  const { data: currentPlayer, isLoading: isProfileLoading } = useDoc<Player>(playerRef);

  const normalizedUserEmail = user?.email?.trim().toLowerCase() || "";
  const emailMatchQuery = useMemoFirebase(() => {
    if (!user || currentPlayer) return null;
    return query(collection(firestore, "players"), where("email", "==", normalizedUserEmail), limit(1));
  }, [firestore, user, currentPlayer, normalizedUserEmail]);
  const { data: matchedProfiles, isLoading: isMatchedProfilesLoading } = useCollection<Player>(emailMatchQuery);
  const preEnteredProfile = matchedProfiles?.find(p => p.id !== user?.uid);

  const isSuperAdminEmailCheck = !!user?.email && SUPER_ADMIN_EMAILS.includes(normalizedUserEmail);
  
  const isAuthDetermined = !isUserLoading && !isProfileLoading && (!emailMatchQuery || (matchedProfiles !== null && !isMatchedProfilesLoading)) && isFirstRunCheck !== null;
  const isAuthorized = !!user && (!!currentPlayer || (matchedProfiles && matchedProfiles.length > 0) || isFirstRunCheck === true || isSuperAdminEmailCheck);
  const isCheckingAuth = !!user && !isAuthDetermined;

  const teamsQuery = useMemoFirebase(() => {
    if (!currentPlayer || !isAuthorized || isCheckingAuth) return null;
    return collection(firestore, "teams");
  }, [firestore, isAuthorized, isCheckingAuth, currentPlayer]);
  const { data: teams } = useCollection<Team>(teamsQuery);

  const gamesQuery = useMemoFirebase(() => {
    if (!currentPlayer || !isAuthorized || isCheckingAuth) return null;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    return query(
      collection(firestore, "games"),
      where("date", ">=", todayStr),
      orderBy("date", "asc"),
      limit(30)
    );
  }, [firestore, isAuthorized, isCheckingAuth, currentPlayer]);
  const { data: upcomingGames, isLoading: isGamesLoading } = useCollection<Game>(gamesQuery);
  
  const playersQuery = useMemoFirebase(() => {
    if (!currentPlayer || !isAuthorized || isCheckingAuth) return null;
    return collection(firestore, "players");
  }, [firestore, isAuthorized, isCheckingAuth, currentPlayer]);
  const { data: players } = useCollection<Player>(playersQuery);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
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
      email: user.email?.trim().toLowerCase() || "",
      isLinked: true 
    };
    setDoc(newDocRef, claimData).then(() => {
      deleteDoc(oldDocRef).catch(() => {});
      toast({ title: "Profile Claimed!" });
    }).finally(() => {
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
      isLinked: true,
      email: user.email?.trim().toLowerCase() || ""
    };
    if (!currentPlayer) {
      Object.assign(adminData, {
        name: user.displayName || "Admin User",
        status: "Active",
        teams: [],
        preferredPositions: ["MF", "FW"],
        number: 10
      });
    }
    setDoc(adminRef, adminData, { merge: true }).then(() => {
      toast({ title: "Admin Rights Granted" });
    }).finally(() => {
      setIsClaimingAdmin(false);
    });
  };

  const handleToggleAdminRole = () => {
    if (!user || !currentPlayer) return;
    const newAdminStatus = !currentPlayer.isAdmin;
    setDoc(doc(firestore, "players", user.uid), { id: user.uid, isAdmin: newAdminStatus }, { merge: true });
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
    sampleTeams.forEach(t => setDoc(doc(firestore, "teams", t.id), t));
    const sampleKits = [
      { id: "kit-home-1", name: "Home 1", nameZh: "主場一", color: "Pink / Grey", colorZh: "粉紅 / 灰", imageUrl: "https://picsum.photos/seed/kit1/600/800" },
      { id: "kit-away-1", name: "Away 1", nameZh: "客場一", color: "Black / Black", colorZh: "全黑", imageUrl: "https://picsum.photos/seed/kit2/600/800" },
    ];
    sampleKits.forEach(k => setDoc(doc(firestore, "kits", k.id), k));
    const today = new Date().toISOString().split('T')[0];
    const sampleGames = [
      { id: "seed-g1", date: today, startTime: "19:00", endTime: "21:00", location: "Central Sports Complex, Pitch 1", type: "League", team: "team-a", opponent: "Blue Arrows FC", coach: "Sir Alex", fee: "$100\nPayment via Bank Transfer", kitColors: "kit-home-1", alternativeKitColors: "kit-away-1", additionalDetails: "Please arrive 30 mins early for warm up." },
    ];
    sampleGames.forEach(g => setDoc(doc(firestore, "games", g.id), g));
    setDoc(doc(firestore, "players", user.uid), { 
      id: user.uid,
      teams: ["team-a", "team-b", "team-camp3"],
      status: "Active",
      number: currentPlayer?.number || 10
    }, { merge: true });
    toast({ title: "Seeding Complete" });
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

  const handleCopyId = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      toast({ title: "Copied to clipboard" });
    }
  };

  if (isUserLoading || isCheckingAuth) {
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
        {user && (
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-4xl font-headline tracking-tight">
                {language === 'zh' ? `${dict.dashboard.welcome}，${welcomeName}！` : `${dict.dashboard.welcome}, ${welcomeName}!`}
              </h1>
              {currentPlayer && (
                <div className="text-muted-foreground font-medium text-sm md:text-base">{dict.dashboard.subtitle}</div>
              )}
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
              {(!currentPlayer || !currentPlayer.isAdmin) && (isSuperAdminEmailCheck || isFirstRunCheck === true) && (
                <Button variant="outline" size="sm" className="border-dashed border-primary text-primary hover:bg-primary/5 font-bold text-xs" onClick={handleClaimAdmin} disabled={isClaimingAdmin}>
                  {isClaimingAdmin ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-2 h-3.5 w-3.5" />}
                  {dict.dashboard.claimAdmin}
                </Button>
              )}
            </div>
          </header>
        )}

        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-muted/20 rounded-3xl border border-dashed border-primary/20">
            <Lock className="h-10 w-10 text-primary mb-4" />
            <h2 className="text-xl md:text-2xl font-headline mb-2">{dict.attendance.signinRequired}</h2>
            <div className="text-muted-foreground text-sm max-w-sm">{dict.attendance.signinRequired}</div>
            <Button onClick={handleLogin} disabled={isLoggingIn} className="mt-6 bg-primary hover:bg-primary/90 gap-2 font-bold h-11 px-8 shadow-md rounded-xl">
              {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {dict.nav.signIn}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {!currentPlayer ? (
              <div className="max-w-3xl mx-auto space-y-8 py-8">
                {preEnteredProfile ? (
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
                ) : (
                  <div className="p-12 text-center bg-muted/10 rounded-3xl border border-dashed border-primary/20 shadow-inner">
                    <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                      <UserRound className="h-8 w-8 text-primary/40" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-headline mb-3">{dict.dashboard.pendingProfileTitle}</h2>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8 leading-relaxed">
                      {dict.dashboard.pendingProfileDesc}
                    </p>
                    <div className="flex flex-col items-center gap-2 max-w-xs mx-auto p-4 bg-white rounded-2xl border shadow-sm">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                        <Fingerprint className="h-3.5 w-3.5" /> User ID
                      </div>
                      <code className="text-xs font-mono font-bold bg-muted px-3 py-1 rounded-lg select-all w-full truncate">{user.uid}</code>
                      <Button variant="ghost" size="sm" onClick={handleCopyId} className="w-full text-primary hover:bg-primary/5 font-bold text-xs gap-2">
                        <Copy className="h-3.5 w-3.5" /> {dict.dashboard.copyId}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-8">
                <section>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                    <h2 className="text-xl md:text-2xl font-headline flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-primary" />{dict.nav.dashboard}
                      <Badge variant="outline" className="hidden sm:inline-flex ml-2 bg-primary/10 text-primary border-primary/20 font-bold">
                        {currentPlayer.isAdmin ? dict.dashboard.fullAccess : dict.dashboard.teamView(currentPlayer.teams?.length ? currentPlayer.teams?.map(getTeamName).join(', ') : dict.dashboard.noTeam)}
                      </Badge>
                    </h2>
                  </div>

                  <div className="grid gap-6">
                    {isGamesLoading ? (
                      <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
                    ) : filteredGames.length === 0 ? (
                      <Card className="p-12 text-center border-dashed border-2 text-muted-foreground">{dict.dashboard.noGames}</Card>
                    ) : (
                      filteredGames.map((game) => (
                        <Card key={game.id} className="border-none shadow-md overflow-hidden border-l-4 border-primary transition-all">
                          <CardContent className="p-0 flex flex-col">
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
                                <span className="text-xs md:sm font-bold text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{game.startTime} - {game.endTime}</span>
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

                              <GameAttendanceSection 
                                game={game} 
                                user={user} 
                                allPlayers={players} 
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
