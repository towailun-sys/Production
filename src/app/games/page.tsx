
"use client";

import { useState, useEffect } from "react";
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
  Shirt
} from "lucide-react";
import { Game, GameType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getStoredGames, saveStoredGames } from "@/lib/local-store";
import { useToast } from "@/hooks/use-toast";

const KIT_OPTIONS = [
  { label: "Home 1: Pink/Grey", color: "text-pink-500" },
  { label: "Home 2: White/White", color: "text-slate-400" },
  { label: "Away 1: Black/Black", color: "text-slate-900" },
  { label: "Away 2: White/White", color: "text-slate-400" },
  { label: "TBD", color: "text-muted-foreground" }
];

const getKitColorClass = (kitLabel: string) => {
  return KIT_OPTIONS.find(opt => opt.label === kitLabel)?.color || "text-muted-foreground";
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    type: GameType;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    opponent: string;
    kitColors: string;
  }>({
    type: "Training",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    opponent: "",
    kitColors: "TBD",
  });

  useEffect(() => {
    setGames(getStoredGames());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveStoredGames(games);
    }
  }, [games, isLoaded]);

  const resetForm = () => {
    setFormData({ type: "Training", date: "", startTime: "", endTime: "", location: "", opponent: "", kitColors: "TBD" });
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

    const newGame: Game = {
      id: Math.random().toString(36).substring(2, 11),
      type: formData.type,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      opponent: isOpponentNotRequired(formData.type) ? "N/A" : (formData.opponent || undefined),
      kitColors: formData.kitColors || "TBD",
    };

    setGames([...games, newGame].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setIsAddOpen(false);
    resetForm();
    toast({
      title: "Event Scheduled",
      description: "The new event has been added to the calendar.",
    });
  };

  const handleEditClick = (game: Game) => {
    setEditingGame(game);
    setFormData({
      type: game.type,
      date: game.date,
      startTime: game.startTime,
      endTime: game.endTime,
      location: game.location,
      opponent: (game.opponent === "N/A" || !game.opponent) ? "" : game.opponent,
      kitColors: game.kitColors || "TBD",
    });
    
    setTimeout(() => {
      setIsEditOpen(true);
    }, 100);
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

    const updatedGames = games.map(g => 
      g.id === editingGame.id 
        ? { 
            ...g, 
            type: formData.type, 
            date: formData.date, 
            startTime: formData.startTime,
            endTime: formData.endTime,
            location: formData.location, 
            opponent: isOpponentNotRequired(formData.type) ? "N/A" : (formData.opponent || undefined),
            kitColors: formData.kitColors || "TBD",
          }
        : g
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setGames(updatedGames);
    setIsEditOpen(false);
    setEditingGame(null);
    resetForm();
    toast({
      title: "Event Updated",
      description: "Changes to the event have been saved.",
    });
  };

  const handleDeleteGame = (id: string) => {
    setGames(games.filter(g => g.id !== id));
    toast({
      title: "Event Deleted",
      description: "The event has been removed from the schedule.",
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline">Game Schedule</h1>
            <p className="text-muted-foreground">Plan and manage upcoming fixtures.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" />
                Schedule Game
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-headline">Schedule New Event</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Event Type</Label>
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
                      <SelectItem value="Training">Training Session</SelectItem>
                      <SelectItem value="League">League Match</SelectItem>
                      <SelectItem value="Friendly">Friendly Match</SelectItem>
                      <SelectItem value="Internal">Internal Game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input id="startTime" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Stadium or Pitch name" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="opponent">Opponent {isOpponentNotRequired(formData.type) ? '(Auto: N/A)' : '(Optional)'}</Label>
                  <Input 
                    id="opponent" 
                    placeholder={isOpponentNotRequired(formData.type) ? 'N/A' : 'Away Team Name'} 
                    value={isOpponentNotRequired(formData.type) ? '' : formData.opponent} 
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    disabled={isOpponentNotRequired(formData.type)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kitColors">Kit Selection</Label>
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
                <Button onClick={handleAddGame} className="bg-accent w-full">Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {games.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <p className="text-muted-foreground">No events scheduled. Use the button above to add one.</p>
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
                        {(game.opponent && game.opponent !== 'N/A') && (
                          <span className="text-sm font-medium text-muted-foreground">Fixture</span>
                        )}
                      </div>
                      <h3 className="text-xl font-headline font-bold">
                        {game.type === 'Training' ? 'Team Training Session' : 
                         game.type === 'Internal' ? 'Internal Squad Game' : 
                         `vs ${game.opponent || 'TBD'}`}
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
                            Kit: {game.kitColors}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-bold gap-1" asChild>
                        <a href={`/attendance`}>
                          View Attendance
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEditClick(game)} className="gap-2">
                            <Pencil className="h-4 w-4" />
                            Edit Event
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteGame(game.id)} className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              <DialogTitle className="font-headline">Edit Event</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Event Type</Label>
                <Select 
                  value={formData.type}
                  onValueChange={(val: GameType) => setFormData({ ...formData, type: val, opponent: isOpponentNotRequired(val) ? "" : formData.opponent })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Training">Training Session</SelectItem>
                    <SelectItem value="League">League Match</SelectItem>
                    <SelectItem value="Friendly">Friendly Match</SelectItem>
                    <SelectItem value="Internal">Internal Game</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input id="edit-date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input id="edit-startTime" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input id="edit-endTime" type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" placeholder="Stadium or Pitch name" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-opponent">Opponent {isOpponentNotRequired(formData.type) ? '(Auto: N/A)' : '(Optional)'}</Label>
                <Input 
                  id="edit-opponent" 
                  placeholder={isOpponentNotRequired(formData.type) ? 'N/A' : 'Away Team Name'} 
                  value={isOpponentNotRequired(formData.type) ? '' : formData.opponent} 
                  onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                  disabled={isOpponentNotRequired(formData.type)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-kitColors">Kit Selection</Label>
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
              <Button onClick={handleUpdateGame} className="bg-primary w-full">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
