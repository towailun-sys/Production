
"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  UserPlus, 
  Filter, 
  Pencil, 
  Trash2, 
  Activity, 
  HeartPulse, 
  Ban, 
  CreditCard, 
  Lock, 
  Loader2, 
  ShieldCheck,
  Fingerprint,
  Hash
} from "lucide-react";
import { Player, PlayerPosition, TeamType, PlayerStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, deleteDoc, setDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const POSITIONS: { value: PlayerPosition; label: string }[] = [
  { value: "GK", label: "Goalkeeper" },
  { value: "DF", label: "Defender" },
  { value: "MF", label: "Midfielder" },
  { value: "FW", label: "Forward" },
];

const STATUS_OPTIONS: { value: PlayerStatus; label: string; icon: any; color: string }[] = [
  { value: "Active", label: "Active", icon: Activity, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "Injured", label: "Injured", icon: HeartPulse, color: "text-rose-600 bg-rose-50 border-rose-200" },
  { value: "Not Available", label: "Not Available", icon: Ban, color: "text-slate-600 bg-slate-50 border-slate-200" },
  { value: "Pending for Club Fee", label: "Fee Pending", icon: CreditCard, color: "text-amber-600 bg-amber-50 border-amber-200" },
];

export default function PlayersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const playerRef = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user, isUserLoading]);
  const { data: currentPlayer } = useDoc<Player>(playerRef);
  
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    nickname: string;
    number: string;
    email: string;
    preferredPositions: PlayerPosition[];
    team: TeamType;
    status: PlayerStatus;
  }>({
    id: "",
    name: "",
    nickname: "",
    number: "",
    email: "",
    preferredPositions: [],
    team: "A",
    status: "Active",
  });

  const playersQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "players");
  }, [firestore, user, isUserLoading]);

  const { data: players, isLoading: isPlayersLoading } = useCollection<Player>(playersQuery);

  const filteredPlayers = (players || []).filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.number?.toString().includes(search)
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
        title: "Missing Name",
        description: "Player name is required.",
      });
      return;
    }

    const playerId = formData.id || doc(collection(firestore, "players")).id;
    const playerRef = doc(firestore, "players", playerId);
    
    const finalData = {
      id: playerId,
      name: formData.name,
      nickname: formData.nickname || "",
      number: formData.number ? parseInt(formData.number) : null,
      email: formData.email || "",
      preferredPositions: formData.preferredPositions,
      team: formData.team,
      status: formData.status,
      isAdmin: false
    };

    setDoc(playerRef, finalData)
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: playerRef.path,
          operation: 'create',
          requestResourceData: finalData
        } satisfies SecurityRuleContext));
      });

    resetForm();
    setIsAddOpen(false);
    toast({
      title: "Saving Player",
      description: "The profile is being saved to the squad list.",
    });
  };

  const handleEditClick = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      id: player.id || "",
      name: player.name,
      nickname: player.nickname || "",
      number: player.number?.toString() || "",
      email: player.email || "",
      preferredPositions: player.preferredPositions || [],
      team: player.team || "A",
      status: player.status || "Active",
    });
    
    setTimeout(() => {
      setIsEditOpen(true);
    }, 50);
  };

  const handleUpdatePlayer = () => {
    if (!editingPlayer || !formData.name) return;

    const playerRef = doc(firestore, "players", editingPlayer.id);
    const updateData = {
      id: editingPlayer.id,
      name: formData.name,
      nickname: formData.nickname || "",
      number: formData.number ? parseInt(formData.number) : null,
      email: formData.email || "",
      preferredPositions: formData.preferredPositions,
      team: formData.team,
      status: formData.status 
    };

    setDoc(playerRef, updateData, { merge: true })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: playerRef.path,
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext));
      });

    resetForm();
    setIsEditOpen(false);
    setEditingPlayer(null);
    toast({
      title: "Updating Player",
      description: "Squad information has been updated.",
    });
  };

  const handleDeletePlayer = (id: string) => {
    const playerRef = doc(firestore, "players", id);
    deleteDoc(playerRef)
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: playerRef.path,
          operation: 'delete'
        } satisfies SecurityRuleContext));
      });

    toast({
      title: "Removing Player",
      description: "The player is being removed from the squad list.",
    });
  };

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      nickname: "",
      number: "",
      email: "",
      preferredPositions: [],
      team: "A",
      status: "Active",
    });
  };

  const renderPositionBadges = (positions: PlayerPosition[]) => {
    if (!positions || positions.length === 0) return <span className="text-muted-foreground italic text-xs">No position set</span>;
    
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

  const getStatusConfig = (status: PlayerStatus) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
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
          <p className="text-muted-foreground">Sign in to manage the squad list.</p>
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
            <h1 className="text-3xl font-headline">Player Management</h1>
            <p className="text-muted-foreground">Manage your squad and link Google accounts.</p>
          </div>
          
          {currentPlayer?.isAdmin && (
            <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-headline">Add New Squad Member</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="number">Squad Number</Label>
                      <Input 
                        id="number" 
                        type="number"
                        placeholder="7" 
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nickname">Nickname (Display Name)</Label>
                    <Input 
                      id="nickname" 
                      placeholder="The Rock" 
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="john.doe@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="id" className="flex items-center gap-2">
                      User ID (Optional)
                      <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                    </Label>
                    <Input 
                      id="id" 
                      placeholder="UID (leave blank for pre-entry)" 
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Team</Label>
                      <RadioGroup 
                        value={formData.team} 
                        onValueChange={(val: TeamType) => setFormData({ ...formData, team: val })}
                        className="flex gap-4 p-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="A" id="team-a" />
                          <Label htmlFor="team-a">A</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="B" id="team-b" />
                          <Label htmlFor="team-b">B</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(val: PlayerStatus) => setFormData({ ...formData, status: val })}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Preferred Positions</Label>
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
                  <Button onClick={handleAddPlayer} className="bg-primary w-full">Save Player Profile</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Dialog open={isEditOpen} onOpenChange={(open) => { if(!open) { setIsEditOpen(false); resetForm(); setEditingPlayer(null); } }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Edit Player Profile</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input 
                    id="edit-name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-number">Squad Number</Label>
                  <Input 
                    id="edit-number" 
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nickname">Nickname</Label>
                <Input 
                  id="edit-nickname" 
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Team</Label>
                  <RadioGroup 
                    value={formData.team} 
                    onValueChange={(val: TeamType) => setFormData({ ...formData, team: val })}
                    className="flex gap-4 p-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="A" id="edit-team-a" />
                      <Label htmlFor="edit-team-a">A</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="B" id="edit-team-b" />
                      <Label htmlFor="edit-team-b">B</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val: PlayerStatus) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Preferred Positions</Label>
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
            {isPlayersLoading ? (
              <div className="p-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-muted-foreground">Loading squad list...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[80px] text-center font-bold">#</TableHead>
                    <TableHead className="w-[250px] font-bold">Player Info</TableHead>
                    <TableHead className="font-bold text-center">Team</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Positions</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No players found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers.map((player) => {
                      const statusCfg = getStatusConfig(player.status);
                      const StatusIcon = statusCfg.icon;
                      const isLinked = player.id.length > 20;
                      
                      return (
                        <TableRow key={player.id} className="hover:bg-accent/5">
                          <TableCell className="text-center font-headline font-bold text-lg text-primary">
                            {player.number || <span className="text-muted-foreground text-xs italic">-</span>}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {player.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold leading-none">{player.name}</p>
                                  {player.isAdmin && (
                                    <ShieldCheck className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                                <div className="flex flex-col gap-0.5 mt-1">
                                  {player.nickname && <span className="text-xs text-primary font-bold">"{player.nickname}"</span>}
                                  {player.email && <span className="text-[10px] text-muted-foreground">{player.email}</span>}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "font-bold",
                              player.team === 'A' ? "bg-primary" : "bg-indigo-600"
                            )}>
                              {player.team || 'A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1 font-bold", statusCfg.color)}>
                              <StatusIcon className="h-3 w-3" />
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {renderPositionBadges(player.preferredPositions)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {currentPlayer?.isAdmin && (
                                <>
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
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
