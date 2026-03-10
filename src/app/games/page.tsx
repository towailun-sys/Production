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
  Users
} from "lucide-react";
import { Game, GameType, GameTeamScope, Player } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { dict } from "@/lib/i18n";

const KIT_OPTIONS = [
  { label: "Home 1: Pink/Grey", color: "text-pink-500" },
  { label: "Home 2: New White / New White", color: "text-slate-300" },
  { label: "Away 1: Black/Black", color: "text-slate-950" },
  { label: "Away 2: White/White", color: "text-slate-300" },
  { label: "TBD", color: "text-muted-foreground" }
];

const getKitColorClass = (kitLabel: string) => {
  return KIT_OPTIONS.find(opt => opt.label === kitLabel)?.color || "text-muted-foreground";
};

export default function GamesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const playerRef = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user, isUserLoading]);
  const { data: currentPlayer } = useDoc<Player>(playerRef);

  const [formData, setFormData] = useState<{
    type: GameType;
    team: GameTeamScope;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    opponent: string;
    kitColors: string;
  }>({
    type: "Training",
    team: "All",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    opponent: "",
    kitColors: "TBD",
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
      kitColors: "TBD" 
    });
  };

  const isOpponentNotRequired = (type: GameType) => {
    return type === 'Internal' || type === 'Training';
  };

  const handleAddGame = () => {
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.location) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in date, start time, end time, and location.",
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
      kitColors: formData.kitColors || "TBD",
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
      description: "The new event is being added to the calendar.",
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
      kitColors: game.kitColors || "TBD",
    });
    
    setTimeout(() => {
      setIsEditOpen(true);
    }, 150);
  };

  const handleUpdateGame = () => {
    if (!editingGame || !formData.date || !formData.startTime || !formData.endTime || !formData.location) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in date, start time, end time, and location.",
      });
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
      kitColors: formData.kitColors || "TBD",
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
      description: "Changes to the event are being saved.",
    });
  };

  const handleDeleteGame = (id: string) => {
    const gameRef = doc(firestore, "games", id);
    deleteDoc(gameRef)
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: gameRef.path,
          operation: 'delete'
        } satisfies SecurityRuleContext));
      });

    toast({
      title: "Event Deleted",
      description: "The event is being removed from the schedule.",
    });
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
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-headline mb-2">Access Restricted</h1>
          <p className="text-muted-foreground">Sign in to manage the game schedule.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline">{dict.games.title}</h1>
            <p className="text-muted-foreground">{dict.games.subtitle}</p>
          </div>
          {currentPlayer?.isAdmin && (
            <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  <Plus className="h-4 w-4" />
                  {dict.games.scheduleGame}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-headline">{dict.games.dialog.addTitle}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">{dict.games.dialog.type}</Label>
                      <Select 
                        value={formData.type}
                        onValueChange={(val: GameType) => {
                          setFormData({ ...formData, type: val, opponent: isOpponentNotRequired(val) ? "" : formData.opponent });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Training">Training</SelectItem>
                          <SelectItem value="League">League Match</SelectItem>
                          <SelectItem value="Friendly">Friendly</SelectItem>
                          <SelectItem value="Internal">Internal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="team">{dict.games.dialog.team}</Label>
                      <Select 
                        value={formData.team}
                        onValueChange={(val: GameTeamScope) => setFormData({ ...formData, team: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Team A</SelectItem>
                          <SelectItem value="B">Team B</SelectItem>
                          <SelectItem value="All">All Squads</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">{dict.games.dialog.date}</Label>
                    <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startTime">{dict.games.dialog.start}</Label>
                      <Input id="startTime" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endTime">{dict.games.dialog.end}</Label>
                      <Input id="endTime" type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">{dict.games.dialog.location}</Label>
                    <Input id="location" placeholder="Stadium or Pitch name" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="opponent">{dict.games.dialog.opponent} {isOpponentNotRequired(formData.type) ? '(Auto: N/A)' : '(Optional)'}</Label>
                    <Input 
                      id="opponent" 
                      placeholder={isOpponentNotRequired(formData.type) ? 'N/A' : 'Away Team Name'} 
                      value={isOpponentNotRequired(formData.type) ? '' : formData.opponent} 
                      onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                      disabled={isOpponentNotRequired(formData.type)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="kitColors">{dict.games.dialog.kit}</Label>
                    <Select 
                      value={formData.kitColors}
                      onValueChange={(val) => setFormData({ ...formData, kitColors: val })}
                    >
                      <SelectTrigger id="kitColors">
                        <SelectValue placeholder="Select kit colors" />
                      </SelectTrigger>
                      <SelectContent>
                        {KIT_OPTIONS.map((option) => (
                          <SelectItem key={option.label} value={option.label}>
                            <div className="flex items-center gap-2">
                              <Shirt className={cn("h-4 w-4", option.color)} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddGame} className="bg-primary w-full">{dict.games.dialog.create}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-6">
          {isGamesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-32 animate-pulse bg-muted/50" />
            ))
          ) : !games || games.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <p className="text-muted-foreground">No events scheduled.</p>
            </Card>
          ) : (
            games.map((game) => (
              <Card key={game.id} className="border-none shadow-md hover:shadow-lg transition-all border-l-4 border-primary">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex flex-col items-center justify-center bg-muted/30 p-4 rounded-lg min-w-[100px] border">
                      <span className="text-sm font-bold uppercase text-muted-foreground">
                        {new Date(game.date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-3xl font-bold font-headline text-primary">
                        {new Date(game.date).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                          "font-bold px-2 py-0.5 border-none",
                          game.type === 'League' ? "bg-primary text-white" : 
                          game.type === 'Training' ? "bg-accent text-white" :
                          game.type === 'Internal' ? "bg-indigo-600 text-white" :
                          "bg-muted text-foreground"
                        )}>
                          {game.type}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "border-none flex gap-1 items-center font-bold",
                            game.team === 'A' ? "bg-primary text-white" : 
                            game.team === 'B' ? "bg-indigo-600 text-white" : 
                            "bg-muted text-muted-foreground"
                          )}
                        >
                          <Users className="h-3 w-3" />
                          {dict.common.team} {game.team}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-headline font-bold">
                        {game.type === 'Training' ? dict.common.training : 
                         game.type === 'Internal' ? dict.common.internal : 
                         `${dict.common.matchVs} ${game.opponent || dict.common.tbd}`}
                      </h3>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-primary" />
                          {game.startTime} - {game.endTime}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-primary" />
                          {game.location}
                        </div>
                        {game.kitColors && (
                          <div className={cn("flex items-center gap-1.5 font-bold", getKitColorClass(game.kitColors))}>
                            <Shirt className="h-4 w-4" />
                            {dict.games.dialog.kit}: {game.kitColors}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-bold gap-1" asChild>
                        <Link href={`/attendance?gameId=${game.id}`}>
                          {dict.dashboard.viewRoster}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      {currentPlayer?.isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEditClick(game)} className="gap-2">
                              <Pencil className="h-4 w-4" />
                              {dict.common.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteGame(game.id)} className="gap-2 text-destructive focus:text-destructive">
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">{dict.games.dialog.editTitle}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">{dict.games.dialog.type}</Label>
                  <Select 
                    value={formData.type}
                    onValueChange={(val: GameType) => setFormData({ ...formData, type: val, opponent: isOpponentNotRequired(val) ? "" : formData.opponent })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="League">League Match</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-team">{dict.games.dialog.team}</Label>
                  <Select 
                    value={formData.team}
                    onValueChange={(val: GameTeamScope) => setFormData({ ...formData, team: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Team A</SelectItem>
                      <SelectItem value="B">Team B</SelectItem>
                      <SelectItem value="All">All Squads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">{dict.games.dialog.date}</Label>
                <Input id="edit-date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startTime">{dict.games.dialog.start}</Label>
                  <Input id="edit-startTime" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endTime">{dict.games.dialog.end}</Label>
                  <Input id="edit-endTime" type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">{dict.games.dialog.location}</Label>
                <Input id="edit-location" placeholder="Stadium or Pitch name" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-opponent">{dict.games.dialog.opponent} {isOpponentNotRequired(formData.type) ? '(Auto: N/A)' : '(Optional)'}</Label>
                <Input 
                  id="edit-opponent" 
                  placeholder={isOpponentNotRequired(formData.type) ? 'N/A' : 'Away Team Name'} 
                  value={isOpponentNotRequired(formData.type) ? '' : formData.opponent} 
                  onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                  disabled={isOpponentNotRequired(formData.type)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-kitColors">{dict.games.dialog.kit}</Label>
                <Select 
                  value={formData.kitColors}
                  onValueChange={(val) => setFormData({ ...formData, kitColors: val })}
                >
                  <SelectTrigger id="edit-kitColors">
                    <SelectValue placeholder="Select kit colors" />
                  </SelectTrigger>
                  <SelectContent>
                    {KIT_OPTIONS.map((option) => (
                      <SelectItem key={option.label} value={option.label}>
                        <div className="flex items-center gap-2">
                          <Shirt className={cn("h-4 w-4", option.color)} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateGame} className="bg-primary w-full">{dict.games.dialog.update}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}