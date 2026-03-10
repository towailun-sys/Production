"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Trophy, 
  Users, 
  Calendar, 
  LayoutDashboard, 
  CheckCircle2,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MainNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      href: "/attendance",
      label: "My Attendance",
      icon: CheckCircle2,
      active: pathname === "/attendance",
    },
    {
      href: "/players",
      label: "Players",
      icon: Users,
      active: pathname === "/players",
    },
    {
      href: "/games",
      label: "Games",
      icon: Calendar,
      active: pathname === "/games",
    },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-accent" />
            <span className="font-headline text-xl font-bold tracking-tight">SquadFlow</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-accent",
                  route.active ? "text-accent border-b-2 border-accent pb-1 -mb-1" : "text-primary-foreground/80"
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-primary-foreground">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t bg-primary animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors",
                  route.active ? "bg-accent/20 text-accent" : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-white"
                )}
              >
                <route.icon className="h-5 w-5" />
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
