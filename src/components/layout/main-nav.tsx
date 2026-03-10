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
  X,
  LogOut,
  LogIn
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { dict } from "@/lib/i18n";

export function MainNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Signed in successfully",
        description: "Welcome back to SquadFlow.",
      });
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }

      console.error("Login failed:", error);
      
      let description = error.message || "Could not complete Google authentication.";
      
      if (error.code === 'auth/operation-not-allowed') {
        description = "Google Sign-In is not enabled in your Firebase Console. Please go to Authentication > Sign-in method and enable Google.";
      }

      toast({
        variant: "destructive",
        title: "Sign in failed",
        description,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have been logged out safely.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const routes = [
    {
      href: "/",
      label: dict.nav.dashboard,
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      href: "/attendance",
      label: dict.nav.attendance,
      icon: CheckCircle2,
      active: pathname === "/attendance",
    },
    {
      href: "/players",
      label: dict.nav.players,
      icon: Users,
      active: pathname === "/players",
    },
    {
      href: "/games",
      label: dict.nav.games,
      icon: Calendar,
      active: pathname === "/games",
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-accent" />
            <span className="font-headline text-xl font-bold tracking-tight">{dict.nav.title}</span>
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

            <div className="ml-4 border-l border-primary-foreground/20 pl-6">
              {isUserLoading ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-primary-foreground/20" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 border-2 border-accent">
                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                          {user.displayName?.split(' ').map(n => n[0]).join('') || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{dict.nav.signOut}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleLogin} variant="outline" size="sm" className="bg-white text-primary hover:bg-accent hover:text-white border-none font-bold gap-2">
                  <LogIn className="h-4 w-4" />
                  {dict.nav.signIn}
                </Button>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center gap-4">
            {user && (
              <Avatar className="h-8 w-8 border-2 border-accent">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {user.displayName?.split(' ').map(n => n[0]).join('') || "U"}
                </AvatarFallback>
              </Avatar>
            )}
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
            {!isUserLoading && !user && (
              <Button onClick={handleLogin} variant="outline" className="w-full mt-4 bg-white text-primary border-none font-bold">
                {dict.nav.signIn} with Google
              </Button>
            )}
            {user && (
              <Button onClick={handleLogout} variant="ghost" className="w-full mt-4 text-primary-foreground/80 hover:text-white justify-start gap-3 px-3">
                <LogOut className="h-5 w-5" />
                {dict.nav.signOut}
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}