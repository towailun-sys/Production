
"use client";

import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
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
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trophy, 
  Users, 
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { Game, GameType } from "@/lib/types";
import { useState } from "react";

const mockGames: Game[] = [
  { id: "1", date: "2024-06-15", time: "19:00", location: "Central Sports Complex", type: "League", opponent: "Blue Arrows FC" },
  { id: "2", date: "2024-06-20", time: "18:30", location: "Community Field A", type: "Training" },
  { id: "3", date: "2024-06-27", time: "20:00", location: "Stadium Main Pitch", type: "Friendly", opponent: "Legends United" },
];

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>(mockGames);

  return (
    <div className="min-h-screen bg-background pb-12">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline">Game Schedule</h1>
            <p className="text-muted-foreground">Plan and manage upcoming fixtures.</p>
          </div>
          <Dialog>
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
                  <Select>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Stadium or Pitch name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="opponent">Opponent (Optional)</Label>
                  <Input id="opponent" placeholder="Away Team Name" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-accent w-full">Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {games.map((game) => (
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
                        "bg-muted text-foreground"
                      )}>
                        {game.type}
                      </Badge>
                      {game.opponent && (
                        <span className="text-sm font-medium text-muted-foreground">Fixture</span>
                      )}
                    </div>
                    <h3 className="text-xl font-headline font-bold">
                      {game.type === 'Training' ? 'Team Training Session' : `vs ${game.opponent}`}
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" />
                        {game.time}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {game.location}
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center gap-2 justify-end">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-bold gap-1">
                      View Attendance
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
