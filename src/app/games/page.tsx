
"use client";

import { useState } from "react";
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Clock, 
  MapPin, 
  Plus, 
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Shirt,
  Lock,
  Loader2,
  Users,
  Info,
  UserRound,
  Banknote,
  History,
  CalendarDays,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  UserPlus,
  Crown,
  Search,
  RotateCcw,
  LayoutList,
  Copy,
  ClipboardCheck
} from "lucide-react";
import { Game, GameType, Player, Team, Kit, Attendance, PlayerPosition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useTranslation } from "@/components/language-provider";
import { KitBadge, KitColorText } from "@/app/page";

export default function GamesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { dict, language } = useTranslation();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isOutdatedExpanded, setIsOutdatedExpanded] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [rosterGame, setRosterGame] = useState<Game | null>(null);
  const [summaryGame, setSummaryGame] = useState<Game | null>(null);

  const playerRef = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user, isUserLoading]);
  const { data: currentPlayer } = useDoc<Player>(playerRef);

  const teamsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "teams");
  }, [firestore, user, isUserLoading]);
  const { data: teams } = useCollection<Team>(teamsQuery);

  const kitsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "kits");
  }, [firestore, user, isUserLoading]);
  const { data: kits } = useCollection<Kit>(kitsQuery);

  const playersQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "players");
  }, [firestore, user, isUserLoading]);
  const { data: allPlayers } = useCollection<Player>(playersQuery);

  const [formData, setFormData] = useState<{
    type: GameType;
    team: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    opponent: string;
    coach: string;
    fee: string;
    kitColors: string;
    alternativeKitColors: string;
    additionalDetails: string;
  }>({
    type: "Training",
    team: "All",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    opponent: "",
    coach: "",
    fee: "",
    kitColors: "none",
    alternativeKitColors: "none",
    additionalDetails: "",
  });

  const gamesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "games");
  }, [firestore, user, isUserLoading]);

  const { data: games, isLoading: isGamesLoading } = useCollection<Game>(gamesQuery);

  const resetForm = () => {
    setFormData({ 
      type: "Training", 
      team: "All",
      date: "", 
      startTime: "", 
      endTime: "", 
      location: "", 
      opponent: "", 
      coach: "",
      fee: "",
      kitColors: "none",
      alternativeKitColors: "none",
      additionalDetails: "",
    });
  };

  const isOpponentNotRequired = (type: GameType) => {
    return type === 'Internal' || type === 'Training';
  };

  const handleAddGame = () => {
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.location || !formData.team) {
      toast({
        variant: "destructive",
        title: dict.games.toasts.missingInfo,
        description: dict.games.toasts.missingInfoDesc,
      });
      return;
    }

    const id = Math.random().toString(36).substring(2, 11);
    const gameRef = doc(firestore, "games", id);

    const gameData = {
      id,
      type: formData.type,
      team: formData.team,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      opponent: isOpponentNotRequired(formData.type) ? "N/A" : (formData.opponent || "TBD"),
      coach: formData.coach || "",
      fee: formData.fee || "",
      kitColors: formData.kitColors === "none" ? "" : formData.kitColors,
      alternativeKitColors: formData.alternativeKitColors === "none" ? "" : formData.alternativeKitColors,
      additionalDetails: formData.additionalDetails || "",
    };

    setDoc(gameRef, gameData)
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: gameRef.path,
          operation: 'create',
          requestResourceData: gameData
        } satisfies SecurityRuleContext));
      });

    setIsAddOpen(false);
    resetForm();
    toast({
      title: dict.games.toasts.saving,
      description: dict.games.toasts.savingDesc,
    });
  };

  const handleEditClick = (game: Game) => {
    setEditingGame(game);
    setFormData({
      type: game.type,
      team: game.team || "All",
      date: game.date,
      startTime: game.startTime,
      endTime: game.endTime,
      location: game.location,
      opponent: (game.opponent === "N/A" || !game.opponent) ? "" : game.opponent,
      coach: game.coach || "",
      fee: game.fee || "",
      kitColors: game.kitColors || "none",
      alternativeKitColors: game.alternativeKitColors || "none",
      additionalDetails: game.additionalDetails || "",
    });
    
    setTimeout(() => {
      setIsEditOpen(true);
    }, 150);
  };

  const handleViewRoster = (game: Game) => {
    setRosterGame(game);
    setIsRosterOpen(true);
  };

  const handleViewSummary = (game: Game) => {
    setSummaryGame(game);
    setIsSummaryOpen(true);
  };

  const handleUpdateGame = () => {
    if (!editingGame || !formData.date || !formData.startTime || !formData.endTime || !formData.location || !formData.team) {
      return;
    }

    const gameRef = doc(firestore, "games", editingGame.id);

    const updateData = {
      id: editingGame.id,
      type: formData.type, 
      team: formData.team,
      date: formData.date, 
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location, 
      opponent: isOpponentNotRequired(formData.type) ? "N/A" : (formData.opponent || "TBD"),
      coach: formData.coach || "",
      fee: formData.fee || "",
      kitColors: formData.kitColors === "none" ? "" : formData.kitColors,
      alternativeKitColors: formData.alternativeKitColors === "none" ? "" : formData.alternativeKitColors,
      additionalDetails: formData.additionalDetails || "",
    };

    setDoc(gameRef, updateData, { merge: true })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: gameRef.path,
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext));
      });

    setIsEditOpen(false);
    setEditingGame(null);
    resetForm();
    toast({
      title: dict.games.toasts.updating,
      description: dict.games.toasts.updatingDesc,
    });
  };

  const handleDeleteGame = (id: string) => {
    const gameRef = doc(firestore, "games", id);
    deleteDoc(gameRef).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: gameRef.path,
        operation: 'delete'
      } satisfies SecurityRuleContext));
    });
    toast({ 
      title: dict.games.toasts.removing,
      description: dict.games.toasts.removingDesc,
    });
  };

  const getTeamLabel = (teamId: string) => {
    if (teamId === 'All') return dict.common.teams.All;
    const team = teams?.find(t => t.id === teamId);
    if (!team) return teamId;
    return language === 'zh' ? team.nameZh : team.name;
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <MainNav />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!user || !currentPlayer?.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center px-6">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-xl md:text-2xl font-headline mb-2">{dict.attendance.restrictedTitle}</h1>
          <p className="text-muted-foreground text-sm">{dict.attendance.restrictedDescGames}</p>
        </main>
      </div>
    );
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const sortedGames = (games || []).sort((a, b) => a.date.localeCompare(b.date));
  const upcomingGames = sortedGames.filter(g => g.date >= todayStr);
  const outdatedGames = sortedGames.filter(g => g.date < todayStr);

  const renderGameList = (gameList: Game[], isOutdated: boolean) => (
    <div className="grid gap-6">
      {gameList.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 rounded-2xl flex flex-col items-center gap-4">
          <CalendarIcon className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium text-sm">No fixtures in this category.</p>
        </Card>
      ) : (
        gameList.map((game) => (
          <Card 
            key={game.id} 
            className={cn(
              "border-none shadow-md hover:shadow-lg transition-all border-l-4 rounded-2xl overflow-hidden",
              isOutdated ? "border-muted-foreground opacity-75 grayscale bg-muted/30" : "border-primary"
            )}
          >
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className={cn(
                  "flex flex-row md:flex-col items-center justify-center p-4 md:p-5 rounded-2xl min-w-[100px] border gap-3 md:gap-1",
                  isOutdated ? "bg-muted text-muted-foreground" : "bg-muted/30"
                )}>
                  <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest opacity-60">
                    {new Date(game.date).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className={cn(
                    "text-3xl md:text-4xl font-bold font-headline leading-none",
                    isOutdated ? "text-muted-foreground" : "text-primary"
                  )}>
                    {new Date(game.date).getDate()}
                  </span>
                  <span className="text-[10px] font-bold md:hidden opacity-60">
                    {new Date(game.date).toLocaleString('default', { weekday: 'short' })}
                  </span>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isOutdated && (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-none font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                          <History className="h-3 w-3" />
                          {dict.common.outdated}
                        </Badge>
                      )}
                      <Badge variant="outline" className={cn(
                        "font-bold px-2 py-0.5 border-none text-[10px] uppercase tracking-wider",
                        isOutdated ? "bg-muted-foreground/20 text-muted-foreground" : (
                          game.type === 'League' ? "bg-primary text-white" : 
                          game.type === 'Training' ? "bg-accent text-white" :
                          game.type === 'Internal' ? "bg-indigo-600 text-white" :
                          "bg-muted text-foreground"
                        )
                      )}>
                        {dict.common.gameTypes[game.type] || game.type}
                      </Badge>
                      <Badge variant="secondary" className={cn(
                        "border-none flex gap-1.5 items-center font-bold px-2.5 py-0.5 text-[10px]",
                        isOutdated ? "bg-muted-foreground/20 text-muted-foreground" : "bg-primary text-white"
                      )}>
                        <Users className="h-3 w-3" />
                        {getTeamLabel(game.team)}
                      </Badge>
                    </div>
                    <h3 className={cn(
                      "text-lg md:text-xl font-headline font-bold leading-tight",
                      isOutdated && "text-muted-foreground"
                    )}>
                      {game.type === 'Training' || game.type === 'Internal' 
                        ? dict.common.gameTypes[game.type] 
                        : `${dict.common.matchVs} ${game.opponent || dict.common.tbd}`}
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className={cn("h-4 w-4 shrink-0", !isOutdated && "text-primary")} />
                        {game.startTime} - {game.endTime}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className={cn("h-4 w-4 shrink-0", !isOutdated && "text-primary")} />
                        {game.location}
                      </div>
                      {game.coach && (
                        <div className="flex items-center gap-2">
                          <UserRound className={cn("h-4 w-4 shrink-0", !isOutdated && "text-primary")} />
                          {game.coach}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <KitBadge kitId={game.kitColors} />
                        <KitBadge kitId={game.alternativeKitColors} isAlternative />
                      </div>
                    </div>
                  </div>

                  {game.fee && (
                    <div className={cn(
                      "flex items-start gap-2 text-[12px] font-bold p-3 rounded-xl border",
                      isOutdated ? "bg-muted/20 border-muted text-muted-foreground" : "bg-primary/5 border-primary/10 text-primary"
                    )}>
                      <Banknote className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{game.fee}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewRoster(game)}
                      className="gap-2 font-bold text-xs bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                    >
                      <Users className="h-3.5 w-3.5" />
                      {dict.attendance.rosterTitle}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewSummary(game)}
                      className="gap-2 font-bold text-xs bg-accent/5 border-accent/20 text-accent hover:bg-accent/10"
                    >
                      <LayoutList className="h-3.5 w-3.5" />
                      {dict.attendance.summary.title}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center gap-3 justify-between md:justify-center border-t md:border-none pt-4 md:pt-0">
                  {currentPlayer?.isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-primary/5 rounded-full shrink-0">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3">
                          {dict.games.manageEvent}
                        </DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleEditClick(game)} className="gap-3 py-3">
                          <Pencil className="h-4 w-4" />
                          {dict.common.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteGame(game.id)} className="gap-3 py-3 text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          {dict.common.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-headline">{dict.games.title}</h1>
            <p className="text-muted-foreground text-sm md:text-base">{dict.games.subtitle}</p>
          </div>
          {currentPlayer?.isAdmin && (
            <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2 font-bold h-11 px-6 shadow-md w-full md:w-auto">
                  <Plus className="h-4 w-4" />
                  {dict.games.scheduleGame}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-headline text-xl">{dict.games.dialog.addTitle}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-5 py-4 px-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type" className="text-xs uppercase tracking-wider">{dict.games.dialog.type}</Label>
                      <Select 
                        value={formData.type}
                        onValueChange={(val: GameType) => {
                          setFormData({ ...formData, type: val, opponent: isOpponentNotRequired(val) ? "" : formData.opponent });
                        }}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Training">{dict.common.gameTypes.Training}</SelectItem>
                          <SelectItem value="League">{dict.common.gameTypes.League}</SelectItem>
                          <SelectItem value="Friendly">{dict.common.gameTypes.Friendly}</SelectItem>
                          <SelectItem value="Internal">{dict.common.gameTypes.Internal}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="team" className="text-xs uppercase tracking-wider">{dict.games.dialog.team}</Label>
                      <Select 
                        value={formData.team}
                        onValueChange={(val) => setFormData({ ...formData, team: val })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">{dict.common.teams.All}</SelectItem>
                          {teams?.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {language === 'zh' ? t.nameZh : t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-xs uppercase tracking-wider">{dict.games.dialog.date}</Label>
                    <Input id="date" type="date" className="h-11" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startTime" className="text-xs uppercase tracking-wider">{dict.games.dialog.start}</Label>
                      <Input id="startTime" type="time" className="h-11" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endTime" className="text-xs uppercase tracking-wider">{dict.games.dialog.end}</Label>
                      <Input id="endTime" type="time" className="h-11" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location" className="text-xs uppercase tracking-wider">{dict.games.dialog.location}</Label>
                    <Input id="location" placeholder="Stadium or Pitch name" className="h-11" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="opponent" className="text-xs uppercase tracking-wider">{dict.games.dialog.opponent}</Label>
                      <Input 
                        id="opponent" 
                        placeholder={isOpponentNotRequired(formData.type) ? 'N/A' : 'Away Team Name'} 
                        className="h-11"
                        value={isOpponentNotRequired(formData.type) ? '' : formData.opponent} 
                        onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                        disabled={isOpponentNotRequired(formData.type)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coach" className="text-xs uppercase tracking-wider">{dict.games.dialog.coach}</Label>
                      <Input id="coach" placeholder="Coach Name" className="h-11" value={formData.coach} onChange={(e) => setFormData({ ...formData, coach: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fee" className="text-xs uppercase tracking-wider">{dict.games.dialog.fee}</Label>
                    <Textarea 
                      id="fee" 
                      placeholder="e.g. $100 or Split by all" 
                      className="min-h-[80px] rounded-xl"
                      value={formData.fee} 
                      onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="kitColors" className="text-xs uppercase tracking-wider">{dict.games.dialog.kit}</Label>
                      <Select 
                        value={formData.kitColors}
                        onValueChange={(val) => setFormData({ ...formData, kitColors: val })}
                      >
                        <SelectTrigger id="kitColors" className="h-11">
                          <SelectValue placeholder="Select kit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{dict.common.tbd}</SelectItem>
                          {kits?.map((k) => (
                            <SelectItem key={k.id} value={k.id}>
                              <div className="flex items-center gap-2">
                                <Shirt className="h-4 w-4" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold">{language === 'zh' ? k.nameZh || k.name : k.name}</span>
                                  {k.color && (
                                    <KitColorText colorText={language === 'zh' ? k.colorZh || k.color : k.color} className="text-[10px] font-bold" />
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="alternativeKitColors" className="text-xs uppercase tracking-wider">{dict.games.dialog.alternativeKit}</Label>
                      <Select 
                        value={formData.alternativeKitColors}
                        onValueChange={(val) => setFormData({ ...formData, alternativeKitColors: val })}
                      >
                        <SelectTrigger id="alternativeKitColors" className="h-11">
                          <SelectValue placeholder="Select alt kit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{dict.common.tbd}</SelectItem>
                          {kits?.map((k) => (
                            <SelectItem key={k.id} value={k.id}>
                              <div className="flex items-center gap-2">
                                <Shirt className="h-4 w-4" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold">{language === 'zh' ? k.nameZh || k.name : k.name}</span>
                                  {k.color && (
                                    <KitColorText colorText={language === 'zh' ? k.colorZh || k.color : k.color} className="text-[10px] font-bold" />
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="additionalDetails" className="text-xs uppercase tracking-wider">{dict.games.dialog.details}</Label>
                    <Textarea 
                      id="additionalDetails" 
                      placeholder="e.g. Pitch 4, bring water, etc." 
                      className="min-h-[100px] rounded-xl"
                      value={formData.additionalDetails} 
                      onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button onClick={handleAddGame} className="bg-primary w-full font-bold h-12 shadow-lg">{dict.games.dialog.create}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-12">
          {isGamesLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-32 animate-pulse bg-muted/50 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Upcoming Fixtures */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  <h2 className="text-xl md:text-2xl font-headline font-bold">
                    {dict.games.upcoming}
                  </h2>
                  <Badge className="ml-2 font-bold bg-primary text-white">
                    {upcomingGames.length}
                  </Badge>
                </div>
                {renderGameList(upcomingGames, false)}
              </section>

              {/* Outdated Fixtures */}
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4 opacity-70">
                  <div className="flex items-center gap-3">
                    <History className="h-6 w-6 text-muted-foreground" />
                    <h2 className="text-xl md:text-2xl font-headline font-bold text-muted-foreground">
                      {dict.games.outdated}
                    </h2>
                    <Badge variant="outline" className="ml-2 font-bold text-muted-foreground border-muted-foreground">
                      {outdatedGames.length}
                    </Badge>
                  </div>
                  {outdatedGames.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsOutdatedExpanded(!isOutdatedExpanded)}
                      className="text-muted-foreground font-bold hover:bg-muted"
                    >
                      {isOutdatedExpanded ? (
                        <><ChevronUp className="h-4 w-4 mr-2" /> {dict.common.collapse}</>
                      ) : (
                        <><ChevronDown className="h-4 w-4 mr-2" /> {dict.common.showAll}</>
                      )}
                    </Button>
                  )}
                </div>
                {isOutdatedExpanded && renderGameList(outdatedGames, true)}
              </section>
            </>
          )}
        </div>

        <Dialog open={isEditOpen} onOpenChange={(open) => { if(!open) { setIsEditOpen(false); setEditingGame(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl">{dict.games.dialog.editTitle}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-type" className="text-xs uppercase tracking-wider">{dict.games.dialog.type}</Label>
                  <Select 
                    value={formData.type}
                    onValueChange={(val: GameType) => setFormData({ ...formData, type: val, opponent: isOpponentNotRequired(val) ? "" : formData.opponent })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Training">{dict.common.gameTypes.Training}</SelectItem>
                      <SelectItem value="League">{dict.common.gameTypes.League}</SelectItem>
                      <SelectItem value="Friendly">{dict.common.gameTypes.Friendly}</SelectItem>
                      <SelectItem value="Internal">{dict.common.gameTypes.Internal}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-team" className="text-xs uppercase tracking-wider">{dict.games.dialog.team}</Label>
                  <Select 
                    value={formData.team}
                    onValueChange={(val) => setFormData({ ...formData, team: val })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">{dict.common.teams.All}</SelectItem>
                      {teams?.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {language === 'zh' ? t.nameZh : t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date" className="text-xs uppercase tracking-wider">{dict.games.dialog.date}</Label>
                <Input id="edit-date" type="date" className="h-11" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startTime" className="text-xs uppercase tracking-wider">{dict.games.dialog.start}</Label>
                  <Input id="edit-startTime" type="time" className="h-11" value={formData.date && formData.startTime ? formData.startTime : ""} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endTime" className="text-xs uppercase tracking-wider">{dict.games.dialog.end}</Label>
                  <Input id="edit-endTime" type="time" className="h-11" value={formData.date && formData.endTime ? formData.endTime : ""} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location" className="text-xs uppercase tracking-wider">{dict.games.dialog.location}</Label>
                <Input id="edit-location" placeholder="Stadium or Pitch name" className="h-11" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-opponent" className="text-xs uppercase tracking-wider">{dict.games.dialog.opponent}</Label>
                  <Input 
                    id="edit-opponent" 
                    placeholder={isOpponentNotRequired(formData.type) ? 'N/A' : 'Away Team Name'} 
                    className="h-11"
                    value={isOpponentNotRequired(formData.type) ? '' : formData.opponent} 
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    disabled={isOpponentNotRequired(formData.type)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-coach" className="text-xs uppercase tracking-wider">{dict.games.dialog.coach}</Label>
                  <Input id="edit-coach" placeholder="Coach Name" className="h-11" value={formData.coach} onChange={(e) => setFormData({ ...formData, coach: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-fee" className="text-xs uppercase tracking-wider">{dict.games.dialog.fee}</Label>
                <Textarea 
                  id="edit-fee" 
                  placeholder="e.g. $100 or Split by all" 
                  className="min-h-[80px] rounded-xl"
                  value={formData.fee} 
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-kitColors" className="text-xs uppercase tracking-wider">{dict.players.dialog.kit}</Label>
                  <Select 
                    value={formData.kitColors}
                    onValueChange={(val) => setFormData({ ...formData, kitColors: val })}
                  >
                    <SelectTrigger id="edit-kitColors" className="h-11">
                      <SelectValue placeholder="Select kit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{dict.common.tbd}</SelectItem>
                      {kits?.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          <div className="flex items-center gap-2">
                            <Shirt className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{language === 'zh' ? k.nameZh || k.name : k.name}</span>
                              {k.color && (
                                <KitColorText colorText={language === 'zh' ? k.colorZh || k.color : k.color} className="text-[10px] font-bold" />
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-alternativeKitColors" className="text-xs uppercase tracking-wider">{dict.games.dialog.alternativeKit}</Label>
                  <Select 
                    value={formData.alternativeKitColors}
                    onValueChange={(val) => setFormData({ ...formData, alternativeKitColors: val })}
                  >
                    <SelectTrigger id="edit-alternativeKitColors" className="h-11">
                      <SelectValue placeholder="Select alt kit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{dict.common.tbd}</SelectItem>
                      {kits?.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          <div className="flex items-center gap-2">
                            <Shirt className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{language === 'zh' ? k.nameZh || k.name : k.name}</span>
                              {k.color && (
                                <KitColorText colorText={language === 'zh' ? k.colorZh || k.color : k.color} className="text-[10px] font-bold" />
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-additionalDetails" className="text-xs uppercase tracking-wider">{dict.games.dialog.details}</Label>
                <Textarea 
                  id="edit-additionalDetails" 
                  placeholder="e.g. Pitch 4, bring water, etc." 
                  className="min-h-[100px] rounded-xl"
                  value={formData.additionalDetails} 
                  onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={handleUpdateGame} className="bg-primary w-full font-bold h-12 shadow-lg">{dict.games.dialog.update}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {rosterGame && (
          <GameRosterDialog 
            game={rosterGame} 
            players={allPlayers || []} 
            isOpen={isRosterOpen} 
            onOpenChange={setIsRosterOpen} 
          />
        )}

        {summaryGame && (
          <GameSummaryDialog 
            game={summaryGame} 
            players={allPlayers || []} 
            isOpen={isSummaryOpen} 
            onOpenChange={setIsSummaryOpen} 
          />
        )}
      </main>
    </div>
  );
}

function GameSummaryDialog({ 
  game, 
  players, 
  isOpen, 
  onOpenChange 
}: { 
  game: Game; 
  players: Player[]; 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const firestore = useFirestore();
  const { dict, language } = useTranslation();
  const { toast } = useToast();

  const attendanceQuery = useMemoFirebase(() => {
    return collection(firestore, "games", game.id, "attendanceRecords");
  }, [firestore, game.id]);
  const { data: attendanceRecords, isLoading } = useCollection<Attendance>(attendanceQuery);

  const confirmedRecords = (attendanceRecords || []).filter(r => r.status === 'Confirmed');
  
  const categorizedPlayers = {
    GK: [] as Player[],
    DF: [] as Player[],
    MF: [] as Player[],
    FW: [] as Player[],
  };

  const guests: Attendance[] = [];

  confirmedRecords.forEach(record => {
    if (record.isGuest) {
      guests.push(record);
    } else {
      const player = players.find(p => p.id === record.playerId);
      if (player) {
        // Assign to first preferred position for categorization
        const primaryPos = player.preferredPositions[0] || 'MF';
        categorizedPlayers[primaryPos as keyof typeof categorizedPlayers]?.push(player);
      }
    }
  });

  const handleCopyWhatsApp = () => {
    const date = new Date(game.date);
    const dateStr = language === 'zh' 
      ? `${date.getMonth() + 1}月${date.getDate()}日`
      : date.toLocaleDateString('default', { month: 'short', day: 'numeric' });

    const title = `⚽ *HHFC Attendance Summary* ⚽\n` +
                 `📅 ${dateStr} (${game.startTime})\n` +
                 `📍 ${game.location}\n` +
                 `🏆 ${game.opponent !== 'N/A' ? 'Match vs ' + game.opponent : dict.common.gameTypes[game.type]}\n\n` +
                 `✅ *Confirmed (${confirmedRecords.length}):*\n`;

    let squadList = "";
    const positions: PlayerPosition[] = ['GK', 'DF', 'MF', 'FW'];
    
    positions.forEach(pos => {
      const list = categorizedPlayers[pos];
      if (list.length > 0) {
        squadList += `*${pos}:* ${list.map(p => `${p.number ? '#' + p.number + ' ' : ''}${p.nickname || p.name}`).join(', ')}\n`;
      }
    });

    if (guests.length > 0) {
      squadList += `*Guests:* ${guests.map(g => g.guestName).join(', ')}\n`;
    }

    const text = title + squadList;
    navigator.clipboard.writeText(text);
    toast({ 
      title: dict.attendance.summary.copied,
      description: "Ready to paste in WhatsApp!",
    });
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-6 bg-accent/5 border-b">
          <DialogTitle className="font-headline flex items-center gap-3 text-accent-foreground">
            <LayoutList className="h-5 w-5" />
            {dict.attendance.summary.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-primary/60 tracking-widest">{dict.common.status}</div>
              <div className="text-xl font-headline font-bold text-primary">{confirmedRecords.length} {dict.common.confirm}</div>
            </div>
            <div className="flex gap-1.5">
              {['GK', 'DF', 'MF', 'FW'].map(pos => (
                <div key={pos} className="flex flex-col items-center min-w-[35px]">
                  <span className="text-[10px] font-bold text-muted-foreground">{pos}</span>
                  <span className="font-bold">{categorizedPlayers[pos as keyof typeof categorizedPlayers].length}</span>
                </div>
              ))}
            </div>
          </div>

          {confirmedRecords.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground italic">
              {dict.attendance.summary.noConfirmed}
            </div>
          ) : (
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">
                {dict.attendance.summary.stats}
              </h4>
              
              <div className="space-y-4">
                {(['GK', 'DF', 'MF', 'FW'] as PlayerPosition[]).map(pos => {
                  const list = categorizedPlayers[pos];
                  if (list.length === 0) return null;
                  return (
                    <div key={pos} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                          "font-bold text-[10px] px-1.5 py-0 h-5",
                          pos === 'GK' && "border-yellow-500 text-yellow-600 bg-yellow-50",
                          pos === 'DF' && "border-blue-500 text-blue-600 bg-blue-50",
                          pos === 'MF' && "border-green-500 text-green-600 bg-green-50",
                          pos === 'FW' && "border-red-500 text-red-600 bg-red-50",
                        )}>
                          {dict.common.positions[pos.toLowerCase() as keyof typeof dict.common.positions] || pos}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground">{list.length} {dict.common.player}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {list.map(p => (
                          <div key={p.id} className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-lg text-xs font-medium">
                            {p.isCaptain && <Crown className="h-3 w-3 text-accent" />}
                            {p.number !== undefined && <span className="text-primary font-bold">#{p.number}</span>}
                            <span>{p.nickname || p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {guests.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-bold text-[10px] border-primary/30 text-primary bg-primary/5 px-1.5 py-0 h-5 uppercase">
                        {dict.attendance.summary.guestList}
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground">{guests.length} {dict.common.player}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {guests.map(g => (
                        <div key={g.id} className="flex items-center gap-1.5 bg-primary/5 border border-dashed border-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold text-primary">
                          <UserPlus className="h-3 w-3" />
                          <span>{g.guestName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="p-6 border-t bg-muted/20">
          <Button onClick={handleCopyWhatsApp} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-12 shadow-md gap-3 rounded-xl">
            <Copy className="h-5 w-5" />
            {dict.attendance.summary.copyBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GameRosterDialog({ 
  game, 
  players, 
  isOpen, 
  onOpenChange 
}: { 
  game: Game; 
  players: Player[]; 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const firestore = useFirestore();
  const { dict } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [guestName, setGuestName] = useState("");

  const attendanceQuery = useMemoFirebase(() => {
    return collection(firestore, "games", game.id, "attendanceRecords");
  }, [firestore, game.id]);
  const { data: attendanceRecords } = useCollection<Attendance>(attendanceQuery);

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    p.number?.toString().includes(search)
  );

  const handleUpdateStatus = (playerId: string, status: 'Confirmed' | 'Declined' | 'Pending') => {
    const recordRef = doc(firestore, "games", game.id, "attendanceRecords", playerId);
    const userRecordRef = doc(firestore, "users", playerId, "game_attendances", game.id);

    const data = {
      id: playerId,
      gameId: game.id,
      playerId: playerId,
      status: status,
      lastUpdated: new Date().toISOString()
    };

    if (status === 'Pending') {
      deleteDoc(recordRef);
      deleteDoc(userRecordRef);
      toast({ 
        title: dict.attendance.toasts.statusUpdated, 
        description: dict.common.pending 
      });
    } else {
      setDoc(recordRef, data, { merge: true });
      setDoc(userRecordRef, data, { merge: true });
      toast({ 
        title: dict.attendance.toasts.statusUpdated, 
        description: dict.attendance.toasts.statusDesc(status) 
      });
    }
  };

  const handleAddGuest = () => {
    if (!guestName.trim()) return;
    const guestId = `guest-${Math.random().toString(36).substring(2, 9)}`;
    const recordRef = doc(firestore, "games", game.id, "attendanceRecords", guestId);

    const data = {
      id: guestId,
      gameId: game.id,
      playerId: guestId,
      status: 'Confirmed' as const,
      isGuest: true,
      guestName: guestName.trim(),
      lastUpdated: new Date().toISOString()
    };

    setDoc(recordRef, data);
    setGuestName("");
    toast({ title: dict.attendance.toasts.guestAdded, description: dict.attendance.toasts.guestAddedDesc });
  };

  const handleDeleteGuest = (guestId: string) => {
    deleteDoc(doc(firestore, "games", game.id, "attendanceRecords", guestId));
    toast({ title: "Guest Removed" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="font-headline flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            {dict.attendance.rosterTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Guest Addition */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5" />
              {dict.attendance.addGuest}
            </h4>
            <div className="flex gap-2">
              <Input 
                placeholder={dict.attendance.guestName} 
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="h-11"
              />
              <Button onClick={handleAddGuest} className="bg-primary font-bold h-11 px-6 shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                {dict.common.join}
              </Button>
            </div>
          </section>

          {/* Player Management */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                {dict.players.title}
              </h4>
              <div className="relative max-w-[200px] w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8 h-8 text-xs bg-muted/30 border-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredPlayers.map((player) => {
                const record = attendanceRecords?.find(r => r.playerId === player.id);
                const status = record?.status || 'Pending';
                
                return (
                  <div key={player.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/5">
                        {player.number || player.name[0]}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="font-bold text-sm truncate flex items-center gap-1.5">
                          {player.name}
                          {player.isCaptain && <Crown className="h-3 w-3 text-accent" />}
                        </div>
                        {player.nickname && <span className="text-[10px] text-muted-foreground">"{player.nickname}"</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button 
                        variant={status === 'Confirmed' ? 'default' : 'outline'} 
                        size="sm"
                        title={dict.common.confirm}
                        className={cn(
                          "h-8 px-2.5 rounded-lg text-[10px] font-bold",
                          status === 'Confirmed' ? "bg-primary text-white" : "text-muted-foreground"
                        )}
                        onClick={() => handleUpdateStatus(player.id, 'Confirmed')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant={status === 'Declined' ? 'destructive' : 'outline'} 
                        size="sm"
                        title={dict.common.decline}
                        className={cn(
                          "h-8 px-2.5 rounded-lg text-[10px] font-bold",
                          status === 'Declined' ? "bg-destructive text-white" : "text-muted-foreground"
                        )}
                        onClick={() => handleUpdateStatus(player.id, 'Declined')}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant={status === 'Pending' ? 'secondary' : 'outline'} 
                        size="sm"
                        title={dict.common.pending}
                        className={cn(
                          "h-8 px-2.5 rounded-lg text-[10px] font-bold",
                          status === 'Pending' ? "bg-muted-foreground/30 text-foreground" : "text-muted-foreground"
                        )}
                        onClick={() => handleUpdateStatus(player.id, 'Pending')}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Guests List */}
          {attendanceRecords?.some(r => r.isGuest) && (
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                {dict.attendance.guest}
              </h4>
              <div className="space-y-2">
                {attendanceRecords.filter(r => r.isGuest).map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between p-3 border border-dashed rounded-xl bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                        G
                      </div>
                      <span className="font-bold text-sm">{guest.guestName}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={() => handleDeleteGuest(guest.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        
        <DialogFooter className="p-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full font-bold h-11">
            {dict.common.collapse}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
