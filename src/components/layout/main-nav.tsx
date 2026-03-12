
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
  LogIn,
  Languages
} from "lucide-react";
import { useState, useEffect } from "react";
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
import { useTranslation } from "@/components/language-provider";

export function MainNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, dict } = useTranslation();

  // Handle hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Could not complete Google authentication.",
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
    <nav className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="h-7 w-7 md:h-8 md:w-8 text-accent shrink-0" />
            <span className="font-headline text-lg md:text-xl font-bold tracking-tight">{dict.nav.title}</span>
          </div>

          {/* Desktop Navigation - Only render if mounted to avoid hydration issues */}
          <div className="hidden md:flex items-center space-x-6">
            {mounted && routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-bold transition-all hover:text-accent",
                  route.active ? "text-accent scale-105" : "text-primary-foreground/80"
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}

            <div className="ml-4 flex items-center gap-4 border-l border-primary-foreground/20 pl-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-accent hover:bg-white/10 gap-2 font-bold h-9 px-3">
                    <Languages className="h-4 w-4" />
                    {mounted ? (language === 'en' ? 'EN' : 'ZH') : '...'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">{dict.nav.language}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setLanguage('en')} className={cn("py-2.5", language === 'en' && "bg-accent/10 font-bold")}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('zh')} className={cn("py-2.5", language === 'zh' && "bg-accent/10 font-bold")}>
                    中文 (Chinese)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isUserLoading ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-primary-foreground/20" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border-2 border-accent/30 hover:border-accent transition-all">
                      <Avatar className="h-full w-full">
                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                          {user.displayName?.split(' ').map(n => n[0]).join('') || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive py-3 gap-3">
                      <LogOut className="h-4 w-4" />
                      <span className="font-bold">{dict.nav.signOut}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleLogin} variant="outline" size="sm" className="bg-white text-primary hover:bg-accent hover:text-white border-none font-bold gap-2 h-9 px-4">
                  <LogIn className="h-4 w-4" />
                  {dict.nav.signIn}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground h-9 w-9 hover:bg-white/10">
                  <Languages className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => setLanguage('en')} className="font-bold py-3">English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('zh')} className="font-bold py-3">中文</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {user && (
              <Avatar className="h-9 w-9 border-2 border-accent shrink-0">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-bold">
                  {user.displayName?.split(' ').map(n => n[0]).join('') || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-primary-foreground h-9 w-9 hover:bg-white/10 shrink-0">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden border-t bg-primary animate-in slide-in-from-top-4 duration-300 shadow-2xl pb-6">
          <div className="space-y-1.5 px-4 pt-4">
            {mounted && routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-bold transition-all active:bg-white/10",
                  route.active ? "bg-white/20 text-accent shadow-inner" : "text-primary-foreground/90 hover:bg-white/5"
                )}
              >
                <route.icon className={cn("h-5 w-5 shrink-0", route.active ? "text-accent" : "text-primary-foreground/60")} />
                {route.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 mt-4">
              {!isUserLoading && !user && (
                <Button onClick={handleLogin} variant="outline" className="w-full bg-white text-primary border-none font-bold h-12 text-base rounded-xl active:scale-[0.98]">
                  <LogIn className="mr-2 h-5 w-5" />
                  {dict.nav.signIn}
                </Button>
              )}
              {user && (
                <Button onClick={handleLogout} variant="ghost" className="w-full text-primary-foreground/80 hover:text-white justify-start gap-3 px-4 h-12 font-bold active:bg-white/5 rounded-xl">
                  <LogOut className="h-5 w-5 text-destructive" />
                  {dict.nav.signOut}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
