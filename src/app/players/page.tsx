
"use client";

import { useState } from "react";
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, UserPlus, Filter, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Player, PlayerPosition } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const mockPlayers: Player[] = [
  { id: "1", name: "David Miller", nickname: "Miller", preferredPosition: "GK" },
  { id: "2", name: "Samuel Jackson", preferredPosition: "DF" },
  { id: "3", name: "Marcus Rashford", nickname: "Rashy", preferredPosition: "FW" },
  { id: "4", name: "Kevin De Bruyne", nickname: "KDB", preferredPosition: "MF" },
  { id: "5", name: "Virgil Van Dijk", nickname: "VVD", preferredPosition: "DF" },
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [search, setSearch] = useState("");

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.nickname?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline">Player Management</h1>
            <p className="text-muted-foreground">Manage your team squad and details.</p>
          </div>
          <Dialog>
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
                  <Input id="name" placeholder="John Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nickname">Nickname (Optional)</Label>
                  <Input id="nickname" placeholder="The Rock" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position">Preferred Position</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GK">Goalkeeper (GK)</SelectItem>
                      <SelectItem value="DF">Defender (DF)</SelectItem>
                      <SelectItem value="MF">Midfielder (MF)</SelectItem>
                      <SelectItem value="FW">Forward (FW)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary w-full">Save Player</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
                  <TableHead className="w-[100px] font-bold">Player</TableHead>
                  <TableHead className="font-bold">Nickname</TableHead>
                  <TableHead className="font-bold">Position</TableHead>
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
                        <Badge variant="outline" className={cn(
                          "font-bold px-2",
                          player.preferredPosition === 'GK' && "border-yellow-500 text-yellow-600 bg-yellow-50",
                          player.preferredPosition === 'DF' && "border-blue-500 text-blue-600 bg-blue-50",
                          player.preferredPosition === 'MF' && "border-green-500 text-green-600 bg-green-50",
                          player.preferredPosition === 'FW' && "border-red-500 text-red-600 bg-red-50",
                        )}>
                          {player.preferredPosition}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
