
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
  Plus,
  Mail,
  Smartphone,
  MoreVertical,
  Users,
  UserSearch,
  Shirt,
  Image as ImageIcon
} from "lucide-react";
import { Player, PlayerPosition, PlayerStatus, Team, Kit } from "@/lib/types";
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
import Image from "next/image";

export default function PlayersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { dict, language } = useTranslation();

  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTeamsOpen, setIsTeamsOpen] = useState(false);
  const [isKitsOpen, setIsKitsOpen] = useState(false);
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
    { value: "Trial", label: dict.common.statusTypes.trial, icon: UserSearch, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  ];

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
  
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    nickname: string;
    number: string;
    email: string;
    mobileNumber: string;
    preferredPositions: PlayerPosition[];
    teams: string[];
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
    teams: [],
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

  const handleTeamToggle = (teamId: string) => {
    setFormData(prev => {
      const exists = prev.teams.includes(teamId);
      if (exists) {
        return { ...prev, teams: prev.teams.filter(id => id !== teamId) };
      } else {
        return { ...prev, teams: [...prev.teams, teamId] };
      }
    });
  };

  const handleAddPlayer = () => {
    if (!formData.name || formData.teams.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Name and at least one Team are required.",
      });
      return;
    }

    const playerId = formData.id || doc(collection(firestore, "players")).id;
    const playerRef = doc(firestore, "players", playerId);
    
    const finalData = {
      id: playerId,
      name: formData.name,
      nickname: formData.nickname || "",
      number: formData.number !== "" ? parseInt(formData.number) : null,
      email: formData.email || "",
      mobileNumber: formData.mobileNumber || "",
      preferredPositions: formData.preferredPositions,
      teams: formData.teams,
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
      number: (player.number !== undefined && player.number !== null) ? player.number.toString() : "",
      email: player.email || "",
      mobileNumber: player.mobileNumber || "",
      preferredPositions: player.preferredPositions || [],
      teams: player.teams || [],
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
    if (!editingPlayer || !formData.name || formData.teams.length === 0) return;

    const playerRef = doc(firestore, "players", editingPlayer.id);
    const updateData = {
      id: editingPlayer.id,
      name: formData.name,
      nickname: formData.nickname || "",
      number: formData.number !== "" ? parseInt(formData.number) : null,
      email: formData.email || "",
      mobileNumber: formData.mobileNumber || "",
      preferredPositions: formData.preferredPositions,
      teams: formData.teams,
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

  const handleToggleAdminStatus = (player: Player) => {
    const playerRef = doc(firestore, "players", player.id);
    const newAdminStatus = !player.isAdmin;
    setDoc(playerRef, { isAdmin: newAdminStatus }, { merge: true });
    toast({
      title: newAdminStatus ? "Promoted to Admin" : "Admin Privileges Revoked",
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
      teams: [],
      status: "Active",
      isAdmin: false,
      isCaptain: false,
      isLinked: false,
    });
  };

  const renderPositionBadges = (positions: PlayerPosition[]) => {
    if (!positions || positions.length === 0) return <span className="text-muted-foreground italic text-[10px]">No position set</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {positions.map(pos => (
          <Badge key={pos} variant="outline" className={cn(
            "font-bold px-1.5 py-0 text-[10px]",
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
          <Lock className="h-10 w-10 text-muted-foreground mb-4" />
          <h1 className="text-xl md:text-2xl font-headline mb-2">Access Restricted</h1>
          <div className="text-muted-foreground text-sm">Sign in to manage the squad list.</div>
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
            <h1 className="text-2xl md:text-3xl font-headline">{dict.players.title}</h1>
            <div className="text-sm md:text-base text-muted-foreground">{dict.players.subtitle}</div>
          </div>
          
          {currentPlayer?.isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Dialog open={isKitsOpen} onOpenChange={setIsKitsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 font-bold border-accent text-accent hover:bg-accent/5 h-10 px-4 text-xs md:text-sm">
                    <Shirt className="h-4 w-4" />
                    {dict.players.manageKits}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[500px] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-headline">{dict.players.kits.title}</DialogTitle>
                  </DialogHeader>
                  <KitManagementUI />
                </DialogContent>
              </Dialog>

              <Dialog open={isTeamsOpen} onOpenChange={setIsTeamsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 font-bold border-primary text-primary hover:bg-primary/5 h-10 px-4 text-xs md:text-sm">
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{dict.players.manageTeams}</span>
                    <span className="sm:hidden">{dict.players.teams.title}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-headline">{dict.players.teams.title}</DialogTitle>
                  </DialogHeader>
                  <TeamManagementUI />
                </DialogContent>
              </Dialog>

              <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90 gap-2 font-bold h-10 px-4 text-xs md:text-sm">
                    <UserPlus className="h-4 w-4" />
                    {dict.players.addPlayer}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-headline text-xl">{dict.players.dialog.addTitle}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-5 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="text-xs uppercase tracking-wider">{dict.players.dialog.fullName}</Label>
                        <Input 
                          id="name" 
                          placeholder="John Doe" 
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="number" className="text-xs uppercase tracking-wider">{dict.players.dialog.number}</Label>
                        <Input 
                          id="number" 
                          type="number"
                          placeholder="7 (Optional)" 
                          value={formData.number}
                          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nickname" className="text-xs uppercase tracking-wider">{dict.players.dialog.nickname}</Label>
                      <Input 
                        id="nickname" 
                        placeholder="The Rock" 
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-xs uppercase tracking-wider">{dict.players.dialog.email}</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="john.doe@example.com" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mobileNumber" className="text-xs uppercase tracking-wider">{dict.players.dialog.mobile}</Label>
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
                      <Label htmlFor="id" className="flex items-center gap-2 text-xs uppercase tracking-wider">
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
                    <div className="grid grid-cols-2 gap-4 p-3 border rounded-xl bg-muted/30">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="isCaptain" 
                          checked={formData.isCaptain}
                          onCheckedChange={(val) => setFormData({ ...formData, isCaptain: val as boolean })}
                        />
                        <Label htmlFor="isCaptain" className="font-bold flex items-center gap-1.5 cursor-pointer text-xs uppercase">
                          <Crown className="h-3.5 w-3.5 text-accent" />
                          {dict.players.dialog.captain}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="isAdmin" 
                          checked={formData.isAdmin}
                          onCheckedChange={(val) => setFormData({ ...formData, isAdmin: val as boolean })}
                        />
                        <Label htmlFor="isAdmin" className="font-bold flex items-center gap-1.5 cursor-pointer text-xs uppercase">
                          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          {dict.players.dialog.admin}
                        </Label>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider">{dict.common.team}</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-xl bg-muted/20">
                          {teams?.map((team) => (
                            <div key={team.id} className="flex items-center space-x-3">
                              <Checkbox 
                                id={`team-${team.id}`} 
                                checked={formData.teams.includes(team.id)}
                                onCheckedChange={() => handleTeamToggle(team.id)}
                              />
                              <label
                                htmlFor={`team-${team.id}`}
                                className="text-xs font-bold leading-none cursor-pointer"
                              >
                                {language === 'zh' ? team.nameZh : team.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status" className="text-xs uppercase tracking-wider">{dict.common.statusLabel}</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(val: PlayerStatus) => setFormData({ ...formData, status: val })}
                        >
                          <SelectTrigger id="status" className="h-11">
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
                      <Label className="text-xs uppercase tracking-wider">{dict.players.dialog.preferredPositions}</Label>
                      <div className="grid grid-cols-2 gap-3 p-4 border rounded-xl bg-muted/20">
                        {POSITIONS.map((pos) => (
                          <div key={pos.value} className="flex items-center space-x-3">
                            <Checkbox 
                              id={`pos-${pos.value}`} 
                              checked={formData.preferredPositions.includes(pos.value)}
                              onCheckedChange={() => handlePositionToggle(pos.value)}
                            />
                            <label
                              htmlFor={`pos-${pos.value}`}
                              className="text-xs font-bold leading-none cursor-pointer"
                            >
                              {pos.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button onClick={handleAddPlayer} className="bg-primary w-full font-bold h-12 shadow-lg">{dict.players.dialog.save}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <Dialog open={isEditOpen} onOpenChange={(open) => { if(!open) { setIsEditOpen(false); resetForm(); setEditingPlayer(null); } }}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl">{dict.players.dialog.editTitle}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name" className="text-xs uppercase tracking-wider">{dict.players.dialog.fullName}</Label>
                  <Input 
                    id="edit-name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-number" className="text-xs uppercase tracking-wider">{dict.players.dialog.number}</Label>
                  <Input 
                    id="edit-number" 
                    type="number"
                    placeholder="Optional"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nickname" className="text-xs uppercase tracking-wider">{dict.players.dialog.nickname}</Label>
                <Input 
                  id="edit-nickname" 
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email" className="text-xs uppercase tracking-wider">{dict.players.dialog.email}</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-mobileNumber" className="text-xs uppercase tracking-wider">{dict.players.dialog.mobile}</Label>
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
              <div className="grid grid-cols-2 gap-4 p-3 border rounded-xl bg-muted/30">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-isCaptain" 
                    checked={formData.isCaptain}
                    onCheckedChange={(val) => setFormData({ ...formData, isCaptain: val as boolean })}
                  />
                  <Label htmlFor="edit-isCaptain" className="font-bold flex items-center gap-1.5 cursor-pointer text-xs uppercase">
                    <Crown className="h-3.5 w-3.5 text-accent" />
                    {dict.players.dialog.captain}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-isAdmin" 
                    checked={formData.isAdmin}
                    onCheckedChange={(val) => setFormData({ ...formData, isAdmin: val as boolean })}
                  />
                  <Label htmlFor="edit-isAdmin" className="font-bold flex items-center gap-1.5 cursor-pointer text-xs uppercase">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    {dict.players.dialog.admin}
                  </Label>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs uppercase tracking-wider">{dict.common.team}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-xl bg-muted/20">
                    {teams?.map((team) => (
                      <div key={team.id} className="flex items-center space-x-3">
                        <Checkbox 
                          id={`edit-team-${team.id}`} 
                          checked={formData.teams.includes(team.id)}
                          onCheckedChange={() => handleTeamToggle(team.id)}
                        />
                        <label
                          htmlFor={`edit-team-${team.id}`}
                          className="text-xs font-bold leading-none cursor-pointer"
                        >
                          {language === 'zh' ? team.nameZh : team.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status" className="text-xs uppercase tracking-wider">{dict.common.statusLabel}</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val: PlayerStatus) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger id="edit-status" className="h-11">
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
                <Label className="text-xs uppercase tracking-wider">{dict.players.dialog.preferredPositions}</Label>
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-xl bg-muted/20">
                  {POSITIONS.map((pos) => (
                    <div key={pos.value} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`edit-pos-${pos.value}`} 
                        checked={formData.preferredPositions.includes(pos.value)}
                        onCheckedChange={() => handlePositionToggle(pos.value)}
                      />
                      <label
                        htmlFor={`edit-pos-${pos.value}`}
                        className="text-xs font-bold leading-none cursor-pointer"
                      >
                        {pos.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={handleUpdatePlayer} className="bg-primary w-full font-bold h-12 shadow-lg">{dict.players.dialog.update}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-lg overflow-hidden rounded-2xl">
          <CardHeader className="bg-white border-b py-4 px-6 flex flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={dict.players.searchPlaceholder}
                className="pl-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary h-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-primary/5">
              <Filter className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isPlayersLoading ? (
              <div className="p-20 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
                <div className="text-muted-foreground font-bold">{dict.common.loading}</div>
              </div>
            ) : (
              <>
                {/* Desktop View: Table */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[80px] text-center font-bold text-foreground uppercase text-[10px] tracking-widest">{dict.players.tableHeader.number}</TableHead>
                        <TableHead className="w-[280px] font-bold text-foreground uppercase text-[10px] tracking-widest">{dict.players.tableHeader.info}</TableHead>
                        <TableHead className="font-bold text-center text-foreground uppercase text-[10px] tracking-widest">{dict.players.tableHeader.team}</TableHead>
                        <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-widest">{dict.players.tableHeader.status}</TableHead>
                        <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-widest">{dict.players.tableHeader.positions}</TableHead>
                        <TableHead className="text-right font-bold text-foreground uppercase text-[10px] tracking-widest">{dict.players.tableHeader.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">
                            No players found matching your search.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPlayers.map((player) => {
                          const statusCfg = getStatusConfig(player.status);
                          const StatusIcon = statusCfg.icon;
                          const hasNumber = player.number !== undefined && player.number !== null;
                          
                          return (
                            <TableRow key={player.id} className="hover:bg-primary/5 border-b transition-colors">
                              <TableCell className="text-center font-headline font-bold text-xl text-primary">
                                {hasNumber ? player.number : <span className="text-muted-foreground text-xs italic opacity-30">-</span>}
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/5">
                                      {player.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    {player.isCaptain && (
                                      <div className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground rounded-full p-1 shadow-md border-2 border-white">
                                        <Crown className="h-3 w-3" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="font-bold leading-tight truncate">{player.name}</div>
                                      {player.isAdmin && (
                                        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-1 mt-1.5">
                                      {player.isLinked && (
                                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px] font-bold border border-emerald-100 w-fit">
                                          <LinkIcon className="h-3.5 w-3.5" />
                                          {dict.common.linked}
                                        </div>
                                      )}
                                      {player.nickname && <div className="text-[10px] text-primary font-bold uppercase tracking-wider opacity-80">"{player.nickname}"</div>}
                                      {player.email && <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{player.email}</div>}
                                      {player.mobileNumber && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                          <Phone className="h-3 w-3" />
                                          {player.mobileNumber}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-wrap gap-1 justify-center max-w-[150px] mx-auto">
                                  {player.teams?.map(teamId => (
                                    <Badge key={teamId} className="font-bold bg-primary text-white text-[9px] h-5 py-0">
                                      {getTeamName(teamId)}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("gap-1.5 font-bold py-1 px-2.5", statusCfg.color)}>
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {statusCfg.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {renderPositionBadges(player.preferredPositions)}
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <div className="flex justify-end gap-1">
                                  {currentPlayer?.isAdmin && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10">
                                          <UserCog className="h-5 w-5 text-muted-foreground" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground">Squad Management</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleEditClick(player)} className="gap-3 py-2.5">
                                          <Pencil className="h-4 w-4" />
                                          {dict.players.dialog.editTitle}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleToggleAdminStatus(player)} className="gap-3 py-2.5">
                                          {player.isAdmin ? (
                                            <><ShieldAlert className="h-4 w-4 text-destructive" /> Revoke Admin Role</>
                                          ) : (
                                            <><ShieldCheck className="h-4 w-4 text-primary" /> Promote to Admin</>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDeletePlayer(player.id)} className="gap-3 py-2.5 text-destructive focus:text-destructive">
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
                </div>

                {/* Mobile/Tablet View: Cards */}
                <div className="lg:hidden">
                  {filteredPlayers.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground italic text-sm">
                      No players found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-muted/20">
                      {filteredPlayers.map((player) => {
                        const statusCfg = getStatusConfig(player.status);
                        const StatusIcon = statusCfg.icon;
                        const hasNumber = player.number !== undefined && player.number !== null;
                        
                        return (
                          <div key={player.id} className="bg-white p-5 flex flex-col gap-4 active:bg-primary/5 transition-colors border-b sm:border-r">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/5">
                                    {hasNumber ? player.number : player.name[0]}
                                  </div>
                                  {player.isCaptain && (
                                    <div className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground rounded-full p-1 shadow-md border-2 border-white">
                                      <Crown className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold flex items-center gap-2">
                                    {player.name}
                                    {player.isAdmin && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                                  </div>
                                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5">
                                    {player.nickname ? `"${player.nickname}"` : getTeamName(player.teams[0] || "")}
                                  </div>
                                </div>
                              </div>
                              
                              {currentPlayer?.isAdmin && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/5">
                                      <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => handleEditClick(player)} className="gap-3 py-3">
                                      <Pencil className="h-4 w-4" />
                                      {dict.common.edit}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleAdminStatus(player)} className="gap-3 py-3">
                                      {player.isAdmin ? (
                                        <><ShieldAlert className="h-4 w-4 text-destructive" /> Revoke Admin</>
                                      ) : (
                                        <><ShieldCheck className="h-4 w-4 text-primary" /> Make Admin</>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDeletePlayer(player.id)} className="gap-3 py-3 text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                      {dict.common.delete}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className={cn("gap-1.5 font-bold py-1 px-2.5 text-[10px]", statusCfg.color)}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusCfg.label}
                              </Badge>
                              {player.preferredPositions?.map(pos => (
                                <Badge key={pos} variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                                  {dict.common.positions[pos.toLowerCase() as keyof typeof dict.common.positions] || pos}
                                </Badge>
                              ))}
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-dashed">
                              {player.email && (
                                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5 text-primary/60" />
                                  <span className="truncate">{player.email}</span>
                                </div>
                              )}
                              {player.mobileNumber && (
                                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                                  <Smartphone className="h-3.5 w-3.5 text-primary/60" />
                                  {player.mobileNumber}
                                </div>
                              )}
                              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                                <Users className="h-3.5 w-3.5 text-primary/60" />
                                <div className="flex flex-wrap gap-1">
                                  {player.teams?.map(tId => (
                                    <span key={tId} className="font-bold text-primary">{getTeamName(tId)}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function KitManagementUI() {
  const firestore = useFirestore();
  const { dict, language } = useTranslation();
  const { user, isUserLoading } = useUser();
  const kitsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "kits");
  }, [firestore, user, isUserLoading]);
  const { data: kits } = useCollection<Kit>(kitsQuery);
  const { toast } = useToast();

  const [newKit, setNewKit] = useState<Partial<Kit>>({ name: "", nameZh: "", imageUrl: "", colorClass: "text-primary" });

  const handleAddKit = () => {
    if (!newKit.name || !newKit.imageUrl) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please provide a name and an image URL.",
      });
      return;
    }
    const id = doc(collection(firestore, "kits")).id;
    const kitRef = doc(firestore, "kits", id);
    const kitData = { id, ...newKit };

    setDoc(kitRef, kitData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: kitRef.path,
        operation: 'create',
        requestResourceData: kitData
      } satisfies SecurityRuleContext));
    });

    setNewKit({ name: "", nameZh: "", imageUrl: "", colorClass: "text-primary" });
    toast({ title: "Kit Added" });
  };

  const handleDeleteKit = (id: string) => {
    const kitRef = doc(firestore, "kits", id);
    deleteDoc(kitRef).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: kitRef.path,
        operation: 'delete'
      } satisfies SecurityRuleContext));
    });
    toast({ title: "Kit Deleted" });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="grid gap-4 p-4 border rounded-2xl bg-muted/20">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">{dict.players.kits.nameEn}</Label>
            <Input 
              placeholder="Home 1" 
              value={newKit.name} 
              onChange={(e) => setNewKit({ ...newKit, name: e.target.value })} 
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">{dict.players.kits.nameZh}</Label>
            <Input 
              placeholder="主場一" 
              value={newKit.nameZh} 
              onChange={(e) => setNewKit({ ...newKit, nameZh: e.target.value })} 
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">{dict.players.kits.imageUrl}</Label>
          <Input 
            placeholder="https://..." 
            value={newKit.imageUrl} 
            onChange={(e) => setNewKit({ ...newKit, imageUrl: e.target.value })} 
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">{dict.players.kits.colorClass}</Label>
          <Input 
            placeholder="text-pink-500" 
            value={newKit.colorClass} 
            onChange={(e) => setNewKit({ ...newKit, colorClass: e.target.value })} 
          />
        </div>
        <Button onClick={handleAddKit} size="sm" className="w-full gap-2 font-bold bg-primary h-10 shadow-sm mt-2">
          <Plus className="h-4 w-4" />
          {dict.players.kits.add}
        </Button>
      </div>

      <div className="grid gap-4">
        {kits?.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground italic text-sm">
            {dict.players.kits.noKits}
          </div>
        ) : (
          kits?.map((kit) => (
            <div key={kit.id} className="p-3 border rounded-xl flex items-center justify-between bg-white hover:bg-muted/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 rounded-lg overflow-hidden border bg-muted shrink-0">
                  <Image src={kit.imageUrl} alt={kit.name} fill className="object-cover" />
                </div>
                <div>
                  <div className={cn("font-bold text-sm", kit.colorClass)}>{language === 'zh' ? kit.nameZh : kit.name}</div>
                  <div className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{kit.imageUrl}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => handleDeleteKit(kit.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TeamManagementUI() {
  const firestore = useFirestore();
  const { dict, language } = useTranslation();
  const { user, isUserLoading } = useUser();
  const teamsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) return null;
    return collection(firestore, "teams");
  }, [firestore, user, isUserLoading]);
  const { data: teams } = useCollection<Team>(teamsQuery);
  const { toast } = useToast();

  const [newTeam, setNewTeam] = useState({ name: "", nameZh: "" });

  const handleAddTeam = () => {
    if (!newTeam.name || !newTeam.nameZh) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please provide both English and Chinese names for the team.",
      });
      return;
    }
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
    <div className="space-y-6 py-4">
      <div className="grid gap-5 p-5 border rounded-2xl bg-muted/20">
        <div className="grid gap-2">
          <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{dict.players.teams.nameEn}</Label>
          <Input 
            placeholder="Team A" 
            value={newTeam.name} 
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} 
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{dict.players.teams.nameZh}</Label>
          <Input 
            placeholder="隊伍A" 
            value={newTeam.nameZh} 
            onChange={(e) => setNewTeam({ ...newTeam, nameZh: e.target.value })} 
            className="h-11"
          />
        </div>
        <Button onClick={handleAddTeam} className="w-full gap-2 font-bold bg-primary h-11 shadow-sm">
          <Plus className="h-4 w-4" />
          {dict.players.teams.add}
        </Button>
      </div>

      <div className="divide-y border rounded-2xl overflow-hidden bg-white shadow-sm">
        {teams?.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground italic text-sm">
            {dict.players.teams.noTeams}
          </div>
        ) : (
          teams?.map((team) => (
            <div key={team.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-foreground">{team.name}</div>
                <div className="text-xs text-muted-foreground font-medium">{team.nameZh}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => handleDeleteTeam(team.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
