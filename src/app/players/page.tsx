
"use client";

import { useState, useEffect } from "react";
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, UserPlus, Filter, Pencil, Trash2 } from "lucide-react";
import { Player, PlayerPosition } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getStoredPlayers, saveStoredPlayers } from "@/lib/local-store";

const POSITIONS: { value: PlayerPosition; label: string }[] = [
  { value: "GK", label: "Goalkeeper" },
  { value: "DF", label: "Defender" },
  { value: "MF", label: "Midfielder" },
  { value: "FW", label: "Forward" },
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    nickname: string;
    preferredPositions: PlayerPosition[];
  }>({
    name: "",
    nickname: "",
    preferredPositions: [],
  });

  const { toast } = useToast();

  useEffect(() => {
    setPlayers(getStoredPlayers());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveStoredPlayers(players);
    }
  }, [players, isLoaded]);

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.nickname?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePositionToggle = (pos: PlayerPosition) => {
    setFormData(prev => {
      const exists = prev.preferredPositions.includes(pos);
      if (exists) {
        return { ...prev, preferredPositions: prev.preferredPositions.filter(p => p !== pos) };
      } else {
        return { ...prev, preferredPositions: [...prev.preferredPositions, pos] };
      }
    });
  };

  const handleAddPlayer = () => {
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter at least the player's full name.",
      });
      return;
    }

    const newPlayer: Player = {
      id: Math.random().toString(36).substring(2, 11),
      name: formData.name,
      nickname: formData.nickname || undefined,
      preferredPositions: formData.preferredPositions,
    };

    setPlayers([...players, newPlayer]);
    resetForm();
    setIsAddOpen(false);
    toast({
      title: "Player Added",
      description: `${newPlayer.name} has been added to the squad.`,
    });
  };

  const handleEditClick = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      nickname: player.nickname || "",
      preferredPositions: player.preferredPositions,
    });
    setIsEditOpen(true);
  };

  const handleUpdatePlayer = () => {
    if (!editingPlayer || !formData.name) return;

    const updatedPlayers = players.map(p => 
      p.id === editingPlayer.id 
        ? { ...p, name: formData.name, nickname: formData.nickname || undefined, preferredPositions: formData.preferredPositions }
        : p
    );

    setPlayers(updatedPlayers);
    resetForm();
    setIsEditOpen(false);
    setEditingPlayer(null);
    toast({
      title: "Player Updated",
      description: "Squad information has been saved.",
    });
  };

  const handleDeletePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
    toast({
      title: "Player Removed",
      description: "The player has been removed from the squad list.",
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nickname: "",
      preferredPositions: [],
    });
  };

  const renderPositionBadges = (positions: PlayerPosition[]) => {
    if (positions.length === 0) return <span className="text-muted-foreground italic text-xs">No position set</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {positions.map(pos => (
          <Badge key={pos} variant="outline" className={cn(
            "font-bold px-2",
            pos === 'GK' && "border-yellow-500 text-yellow-600 bg-yellow-50",
            pos === 'DF' && "border-blue-500 text-blue-600 bg-blue-50",
            pos === 'MF' && "border-green-500 text-green-600 bg-green-50",
            pos === 'FW' && "border-red-500 text-red-600 bg-red-50",
          )}>
            {pos}
          </Badge>
        ))}
      </div>
    );
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline">Player Management</h1>
            <p className="text-muted-foreground">Manage your team squad and details.</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 gap-2">
                <UserPlus className="h-4 w-4" />
                Add New Player
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-headline">Add Player Profile</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nickname">Nickname (Optional)</Label>
                  <Input 
                    id="nickname" 
                    placeholder="The Rock" 
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Preferred Positions (Multi-select)</Label>
                  <div className="grid grid-cols-2 gap-3 p-3 border rounded-md bg-muted/20">
                    {POSITIONS.map((pos) => (
                      <div key={pos.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`pos-${pos.value}`} 
                          checked={formData.preferredPositions.includes(pos.value)}
                          onCheckedChange={() => handlePositionToggle(pos.value)}
                        />
                        <label
                          htmlFor={`pos-${pos.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {pos.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPlayer} className="bg-primary w-full">Save Player</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Edit Player Profile</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input 
                  id="edit-name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nickname">Nickname (Optional)</Label>
                <Input 
                  id="edit-nickname" 
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Preferred Positions (Multi-select)</Label>
                <div className="grid grid-cols-2 gap-3 p-3 border rounded-md bg-muted/20">
                  {POSITIONS.map((pos) => (
                    <div key={pos.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`edit-pos-${pos.value}`} 
                        checked={formData.preferredPositions.includes(pos.value)}
                        onCheckedChange={() => handlePositionToggle(pos.value)}
                      />
                      <label
                        htmlFor={`edit-pos-${pos.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {pos.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdatePlayer} className="bg-primary w-full">Update Player</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-white border-b py-4 px-6 flex flex-row items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search players..." 
                className="pl-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Filter className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[200px] font-bold">Player</TableHead>
                  <TableHead className="font-bold">Nickname</TableHead>
                  <TableHead className="font-bold">Positions</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No players found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlayers.map((player) => (
                    <TableRow key={player.id} className="hover:bg-accent/5">
                      <TableCell className="font-medium flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {player.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {player.nickname || "—"}
                      </TableCell>
                      <TableCell>
                        {renderPositionBadges(player.preferredPositions)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditClick(player)}
                          >
                            <Pencil className="h-4 w-4 text-primary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDeletePlayer(player.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
