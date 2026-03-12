
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
  Phone,
  Crown,
  UserCog,
  ShieldAlert,
  Link as LinkIcon,
  Settings2,
  Plus
} from "lucide-react";
import { Player, PlayerPosition, PlayerStatus, Team } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, deleteDoc, setDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useTranslation } from "@/components/language-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function PlayersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { dict, language } = useTranslation();

  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTeamsOpen, setIsTeamsOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const POSITIONS: { value: PlayerPosition; label: string }[] = [
    { value: "GK", label: dict.common.positions.gk },
    { value: "DF", label: dict.common.positions.df },
    { value: "MF", label: dict.common.positions.mf },
    { value: "FW", label: dict.common.positions.fw },
  ];

  const STATUS_OPTIONS: { value: PlayerStatus; label: string; icon: any; color: string }[] = [
    { value: "Active", label: dict.common.statusTypes.active, icon: Activity, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { value: "Injured", label: dict.common.statusTypes.injured, icon: HeartPulse, color: "text-rose-600 bg-rose-50 border-rose-200" },
    { value: "Not Available", label: dict.common.statusTypes.notAvailable, icon: Ban, color: "text-slate-600 bg-slate-50 border-slate-200" },
    { value: "Pending for Club Fee", label: dict.common.statusTypes.feePending, icon: CreditCard, color: "text-amber-600 bg-amber-50 border-amber-200" },
  ];

  const playerRef = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user, isUserLoading]);
  const { data: currentPlayer } = useDoc<Player>(playerRef);

  const teamsQuery = useMemoFirebase(() => collection(firestore, "teams"), [firestore]);
  const { data: teams } = useCollection<Team>(teamsQuery);
  
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    nickname: string;
    number: string;
    email: string;
    mobileNumber: string;
    preferredPositions: PlayerPosition[];
    team: string;
    status: PlayerStatus;
    isAdmin: boolean;
    isCaptain: boolean;
    isLinked: boolean;
  }>({
    id: "",
    name: "",
    nickname: "",
    number: "",
    email: "",
    mobileNumber: "",
    preferredPositions: [],
    team: "",
    status: "Active",
    isAdmin: false,
    isCaptain: false,
    isLinked: false,
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
    p.mobileNumber?.includes(search) ||
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
    if (!formData.name || !formData.team) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Name and Team are required.",
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
      mobileNumber: formData.mobileNumber || "",
      preferredPositions: formData.preferredPositions,
      team: formData.team,
      status: formData.status,
      isAdmin: formData.isAdmin,
      isCaptain: formData.isCaptain,
      isLinked: !!formData.id 
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
      mobileNumber: player.mobileNumber || "",
      preferredPositions: player.preferredPositions || [],
      team: player.team || "",
      status: player.status || "Active",
      isAdmin: player.isAdmin || false,
      isCaptain: player.isCaptain || false,
      isLinked: player.isLinked || false,
    });
    
    setTimeout(() => {
      setIsEditOpen(true);
    }, 50);
  };

  const handleUpdatePlayer = () => {
    if (!editingPlayer || !formData.name || !formData.team) return;

    const playerRef = doc(firestore, "players", editingPlayer.id);
    const updateData = {
      id: editingPlayer.id,
      name: formData.name,
      nickname: formData.nickname || "",
      number: formData.number ? parseInt(formData.number) : null,
      email: formData.email || "",
      mobileNumber: formData.mobileNumber || "",
      preferredPositions: formData.preferredPositions,
      team: formData.team,
      status: formData.status,
      isAdmin: formData.isAdmin,
      isCaptain: formData.isCaptain,
      isLinked: formData.isLinked
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

  const handleToggleAdminStatus = (player: Player) => {
    if (!currentPlayer?.isAdmin) return;
    
    const playerRef = doc(firestore, "players", player.id);
    const newAdminStatus = !player.isAdmin;
    
    const updateData = { id: player.id, isAdmin: newAdminStatus };

    setDoc(playerRef, updateData, { merge: true })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: playerRef.path,
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext));
      });

    toast({
      title: newAdminStatus ? "Player Promoted" : "Admin Rights Revoked",
      description: `${player.name} is ${newAdminStatus ? 'now an administrator' : 'no longer an administrator'}.`,
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
      mobileNumber: "",
      preferredPositions: [],
      team: "",
      status: "Active",
      isAdmin: false,
      isCaptain: false,
      isLinked: false,
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
            {dict.common.positions[pos.toLowerCase() as keyof typeof dict.common.positions] || pos}
          </Badge>
        ))}
      </div>
    );
  };

  const getStatusConfig = (status: PlayerStatus) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const getTeamName = (teamId: string) => {
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
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-headline mb-2">Access Restricted</h1>
          <div className="text-muted-foreground">Sign in to manage the squad list.</div>
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
            <h1 className="text-3xl font-headline">{dict.players.title}</h1>
            <div className="text-muted-foreground">{dict.players.subtitle}</div>
          </div>
          
          {currentPlayer?.isAdmin && (
            <div className="flex gap-2">
              <Dialog open={isTeamsOpen} onOpenChange={setIsTeamsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 font-bold border-primary text-primary hover:bg-primary/5">
                    <Settings2 className="h-4 w-4" />
                    {dict.players.manageTeams}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{dict.players.teams.title}</DialogTitle>
                  </DialogHeader>
                  <TeamManagementUI />
                </DialogContent>
              </Dialog>

              <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90 gap-2 font-bold">
                    <UserPlus className="h-4 w-4" />
                    {dict.players.addPlayer}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline text-xl">{dict.players.dialog.addTitle}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">{dict.players.dialog.fullName}</Label>
                        <Input 
                          id="name" 
                          placeholder="John Doe" 
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="number">{dict.players.dialog.number}</Label>
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
                      <Label htmlFor="nickname">{dict.players.dialog.nickname}</Label>
                      <Input 
                        id="nickname" 
                        placeholder="The Rock" 
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">{dict.players.dialog.email}</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="john.doe@example.com" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mobileNumber">{dict.players.dialog.mobile}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="mobileNumber" 
                          placeholder="012-3456789" 
                          className="pl-9"
                          value={formData.mobileNumber}
                          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="id" className="flex items-center gap-2">
                        {dict.players.dialog.userId}
                        <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                      </Label>
                      <Input 
                        id="id" 
                        placeholder="UID" 
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-4 p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="isCaptain" 
                          checked={formData.isCaptain}
                          onCheckedChange={(val) => setFormData({ ...formData, isCaptain: val as boolean })}
                        />
                        <Label htmlFor="isCaptain" className="font-bold flex items-center gap-1.5 cursor-pointer">
                          <Crown className="h-4 w-4 text-accent" />
                          {dict.players.dialog.captain}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="isAdmin" 
                          checked={formData.isAdmin}
                          onCheckedChange={(val) => setFormData({ ...formData, isAdmin: val as boolean })}
                        />
                        <Label htmlFor="isAdmin" className="font-bold flex items-center gap-1.5 cursor-pointer">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          {dict.players.dialog.admin}
                        </Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="team">{dict.common.team}</Label>
                        <Select 
                          value={formData.team} 
                          onValueChange={(val) => setFormData({ ...formData, team: val })}
                        >
                          <SelectTrigger id="team">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams?.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {language === 'zh' ? team.nameZh : team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">{dict.common.statusLabel}</Label>
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
                      <Label>{dict.players.dialog.preferredPositions}</Label>
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
                    <Button onClick={handleAddPlayer} className="bg-primary w-full font-bold">{dict.players.dialog.save}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <Dialog open={isEditOpen} onOpenChange={(open) => { if(!open) { setIsEditOpen(false); resetForm(); setEditingPlayer(null); } }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl">{dict.players.dialog.editTitle}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">{dict.players.dialog.fullName}</Label>
                  <Input 
                    id="edit-name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-number">{dict.players.dialog.number}</Label>
                  <Input 
                    id="edit-number" 
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nickname">{dict.players.dialog.nickname}</Label>
                <Input 
                  id="edit-nickname" 
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">{dict.players.dialog.email}</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-mobileNumber">{dict.players.dialog.mobile}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="edit-mobileNumber" 
                    placeholder="012-3456789" 
                    className="pl-9"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-isCaptain" 
                      checked={formData.isCaptain}
                      onCheckedChange={(val) => setFormData({ ...formData, isCaptain: val as boolean })}
                    />
                    <Label htmlFor="edit-isCaptain" className="font-bold flex items-center gap-1.5 cursor-pointer">
                      <Crown className="h-4 w-4 text-accent" />
                      {dict.players.dialog.captain}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-isAdmin" 
                      checked={formData.isAdmin}
                      onCheckedChange={(val) => setFormData({ ...formData, isAdmin: val as boolean })}
                    />
                    <Label htmlFor="edit-isAdmin" className="font-bold flex items-center gap-1.5 cursor-pointer">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      {dict.players.dialog.admin}
                    </Label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-team">{dict.common.team}</Label>
                  <Select 
                    value={formData.team} 
                    onValueChange={(val) => setFormData({ ...formData, team: val })}
                  >
                    <SelectTrigger id="edit-team">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {language === 'zh' ? team.nameZh : team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">{dict.common.statusLabel}</Label>
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
                <Label>{dict.players.dialog.preferredPositions}</Label>
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
              <Button onClick={handleUpdatePlayer} className="bg-primary w-full font-bold">{dict.players.dialog.update}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-white border-b py-4 px-6 flex flex-row items-center justify-between">
            <div className="relative w-full max-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={dict.players.searchPlaceholder}
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
                <div className="text-muted-foreground">{dict.common.loading}</div>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[80px] text-center font-bold text-foreground">{dict.players.tableHeader.number}</TableHead>
                    <TableHead className="w-[250px] font-bold text-foreground">{dict.players.tableHeader.info}</TableHead>
                    <TableHead className="font-bold text-center text-foreground">{dict.players.tableHeader.team}</TableHead>
                    <TableHead className="font-bold text-foreground">{dict.players.tableHeader.status}</TableHead>
                    <TableHead className="font-bold text-foreground">{dict.players.tableHeader.positions}</TableHead>
                    <TableHead className="text-right font-bold text-foreground">{dict.players.tableHeader.actions}</TableHead>
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
                      
                      return (
                        <TableRow key={player.id} className="hover:bg-accent/5">
                          <TableCell className="text-center font-headline font-bold text-lg text-primary">
                            {player.number || <span className="text-muted-foreground text-xs italic">-</span>}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                  {player.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                {player.isCaptain && (
                                  <div className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground rounded-full p-0.5 shadow-sm border border-white">
                                    <Crown className="h-3 w-3" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <div className="font-bold leading-none">{player.name}</div>
                                  {player.isCaptain && (
                                    <Badge variant="secondary" className="bg-accent/20 text-accent text-[10px] font-bold h-4 px-1 leading-none">
                                      {dict.common.captain}
                                    </Badge>
                                  )}
                                  {player.isAdmin && (
                                    <ShieldCheck className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                                <div className="flex flex-col gap-0.5 mt-1">
                                  {player.isLinked && (
                                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-100 w-fit mb-1">
                                      <LinkIcon className="h-4 w-4" />
                                      {dict.common.linked}
                                    </div>
                                  )}
                                  {player.nickname && <div className="text-xs text-primary font-bold">"{player.nickname}"</div>}
                                  {player.email && <div className="text-[10px] text-muted-foreground">{player.email}</div>}
                                  {player.mobileNumber && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Phone className="h-2.5 w-2.5" />
                                      {player.mobileNumber}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="font-bold bg-primary text-white">
                              {getTeamName(player.team)}
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <UserCog className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Administrative Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleEditClick(player)} className="gap-2">
                                      <Pencil className="h-4 w-4" />
                                      {dict.players.dialog.editTitle}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleAdminStatus(player)} className="gap-2">
                                      {player.isAdmin ? (
                                        <><ShieldAlert className="h-4 w-4 text-destructive" /> Revoke Admin Role</>
                                      ) : (
                                        <><ShieldCheck className="h-4 w-4 text-primary" /> Promote to Admin</>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDeletePlayer(player.id)} className="gap-2 text-destructive focus:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                      {dict.common.delete}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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

function TeamManagementUI() {
  const firestore = useFirestore();
  const { dict, language } = useTranslation();
  const teamsQuery = useMemoFirebase(() => collection(firestore, "teams"), [firestore]);
  const { data: teams } = useCollection<Team>(teamsQuery);
  const { toast } = useToast();

  const [newTeam, setNewTeam] = useState({ name: "", nameZh: "" });

  const handleAddTeam = () => {
    if (!newTeam.name || !newTeam.nameZh) return;
    const id = doc(collection(firestore, "teams")).id;
    const teamRef = doc(firestore, "teams", id);
    const teamData = { id, ...newTeam };

    setDoc(teamRef, teamData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: teamRef.path,
        operation: 'create',
        requestResourceData: teamData
      } satisfies SecurityRuleContext));
    });

    setNewTeam({ name: "", nameZh: "" });
    toast({ title: "Team Added" });
  };

  const handleDeleteTeam = (id: string) => {
    const teamRef = doc(firestore, "teams", id);
    deleteDoc(teamRef).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: teamRef.path,
        operation: 'delete'
      } satisfies SecurityRuleContext));
    });
    toast({ title: "Team Deleted" });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid gap-4 p-4 border rounded-lg bg-muted/20">
        <div className="grid gap-2">
          <Label>{dict.players.teams.nameEn}</Label>
          <Input 
            placeholder="Team A" 
            value={newTeam.name} 
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} 
          />
        </div>
        <div className="grid gap-2">
          <Label>{dict.players.teams.nameZh}</Label>
          <Input 
            placeholder="隊伍A" 
            value={newTeam.nameZh} 
            onChange={(e) => setNewTeam({ ...newTeam, nameZh: e.target.value })} 
          />
        </div>
        <Button onClick={handleAddTeam} className="w-full gap-2 font-bold">
          <Plus className="h-4 w-4" />
          {dict.players.teams.add}
        </Button>
      </div>

      <div className="divide-y border rounded-lg overflow-hidden">
        {teams?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground italic text-sm">
            {dict.players.teams.noTeams}
          </div>
        ) : (
          teams?.map((team) => (
            <div key={team.id} className="p-3 flex items-center justify-between bg-white hover:bg-muted/10 transition-colors">
              <div>
                <div className="font-bold text-sm">{team.name}</div>
                <div className="text-xs text-muted-foreground">{team.nameZh}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTeam(team.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
