
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
  ChevronRight,
  Pencil,
  Trash2,
  Shirt,
  Lock,
  Loader2,
  Users,
  Info,
  UserRound,
  Banknote,
  Calendar as CalendarIcon
} from "lucide-react";
import { Game, GameType, Player, Team, Kit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import Link from "next/link";
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
  const [editingGame, setEditingGame] = useState<Game | null>(null);

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
    return query(collection(firestore, "games"), orderBy("date", "asc"));
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
        title: "Missing Information",
        description: "Please fill in all required fields.",
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
      title: "Event Scheduled",
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
      title: "Event Updated",
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
    toast({ title: "Event Deleted" });
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center px-6">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-xl md:text-2xl font-headline mb-2">Access Restricted</h1>
          <p className="text-muted-foreground text-sm">Sign in to manage the game schedule.</p>
        </main>
      </div>
    );
  }

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

        <div className="grid gap-6">
          {isGamesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-32 animate-pulse bg-muted/50 rounded-2xl" />
            ))
          ) : !games || games.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-2 rounded-2xl flex flex-col items-center gap-4">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">No events scheduled yet.</p>
            </Card>
          ) : (
            games.map((game) => (
              <Card key={game.id} className="border-none shadow-md hover:shadow-lg transition-all border-l-4 border-primary rounded-2xl overflow-hidden">
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="flex flex-row md:flex-col items-center justify-center bg-muted/30 p-4 md:p-5 rounded-2xl min-w-[100px] border gap-3 md:gap-1">
                      <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        {new Date(game.date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-3xl md:text-4xl font-bold font-headline text-primary leading-none">
                        {new Date(game.date).getDate()}
                      </span>
                      <span className="text-[10px] font-bold md:hidden text-muted-foreground">
                        {new Date(game.date).toLocaleString('default', { weekday: 'short' })}
                      </span>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={cn(
                            "font-bold px-2 py-0.5 border-none text-[10px] uppercase tracking-wider",
                            game.type === 'League' ? "bg-primary text-white" : 
                            game.type === 'Training' ? "bg-accent text-white" :
                            game.type === 'Internal' ? "bg-indigo-600 text-white" :
                            "bg-muted text-foreground"
                          )}>
                            {dict.common.gameTypes[game.type] || game.type}
                          </Badge>
                          <Badge variant="secondary" className="border-none flex gap-1.5 items-center font-bold bg-primary text-white px-2.5 py-0.5 text-[10px]">
                            <Users className="h-3 w-3" />
                            {getTeamLabel(game.team)}
                          </Badge>
                        </div>
                        <h3 className="text-lg md:text-xl font-headline font-bold leading-tight">
                          {game.type === 'Training' || game.type === 'Internal' 
                            ? dict.common.gameTypes[game.type] 
                            : `${dict.common.matchVs} ${game.opponent || dict.common.tbd}`}
                        </h3>
                        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs md:text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary shrink-0" />
                            {game.startTime} - {game.endTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            {game.location}
                          </div>
                          {game.coach && (
                            <div className="flex items-center gap-2">
                              <UserRound className="h-4 w-4 text-primary shrink-0" />
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
                        <div className="flex items-start gap-2 text-[12px] text-primary font-bold bg-primary/5 p-3 rounded-xl border border-primary/10">
                          <Banknote className="h-4 w-4 shrink-0 mt-0.5" />
                          <span className="whitespace-pre-wrap">{game.fee}</span>
                        </div>
                      )}

                      {game.additionalDetails && (
                        <div className="flex items-start gap-2 text-[11px] text-muted-foreground mt-3 bg-muted/20 p-3 rounded-xl border border-dashed">
                          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                          <p className="leading-relaxed whitespace-pre-wrap">{game.additionalDetails}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col items-center gap-3 justify-between md:justify-center border-t md:border-none pt-4 md:pt-0">
                      <Button variant="ghost" size="sm" className="text-primary font-bold gap-1.5 h-10 px-4 flex-1 md:flex-none hover:bg-primary/5" asChild>
                        <Link href={`/attendance?gameId=${game.id}`}>
                          {dict.dashboard.viewRoster}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      
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
                  <Label htmlFor="edit-kitColors" className="text-xs uppercase tracking-wider">{dict.games.dialog.kit}</Label>
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
      </main>
    </div>
  );
}
