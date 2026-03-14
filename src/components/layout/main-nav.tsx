
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  CheckCircle2,
  Menu,
  X,
  LogOut,
  LogIn,
  Languages,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser, useAuth, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
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
import Image from "next/image";
import { Player } from "@/lib/types";

export function MainNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { language, setLanguage, dict } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const playerRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user]);
  
  const { data: currentPlayer } = useDoc<Player>(playerRef);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      await signInWithPopup(auth, provider);
      setIsOpen(false);
      toast({
        title: language === 'zh' ? "登入成功" : "Signed in successfully",
        description: language === 'zh' ? `歡迎回到 ${dict.nav.title}。` : `Welcome back to ${dict.nav.title}.`,
      });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast({
          variant: "destructive",
          title: language === 'zh' ? "登入失敗" : "Sign in failed",
          description: error.message || "Could not complete Google authentication. Please check if the domain is authorized in Firebase.",
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await signOut(auth);
      toast({
        title: language === 'zh' ? "已登出" : "Signed out",
        description: language === 'zh' ? "你已安全登出。" : "You have been logged out safely.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const baseRoutes = [
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
      adminOnly: true,
    },
  ];

  const routes = baseRoutes.filter(route => {
    if (route.adminOnly) {
      return currentPlayer?.isAdmin;
    }
    return true;
  });

  if (!mounted) return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary h-16 shadow-lg" />
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white/20 bg-white group-hover:border-accent transition-colors flex items-center justify-center">
              <Image 
                src="/IMG_8760.jpg" 
                alt="Club Logo" 
                fill 
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="font-headline font-bold text-primary text-lg">
                H
              </div>
            </div>
            <span className="font-headline text-lg md:text-xl font-bold tracking-tight whitespace-nowrap">
              {dict.nav.title}
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {routes.map((route) => (
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
                    {language === 'en' ? 'EN' : 'ZH'}
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
                <Button 
                  onClick={handleLogin} 
                  variant="outline" 
                  size="sm" 
                  disabled={isLoggingIn}
                  className="bg-white text-primary hover:bg-accent hover:text-white border-none font-bold gap-2 h-9 px-4"
                >
                  {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  {dict.nav.signIn}
                </Button>
              )}
            </div>
          </div>

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

      {isOpen && (
        <div className="md:hidden border-t bg-primary animate-in slide-in-from-top-4 duration-300 shadow-2xl pb-6">
          <div className="space-y-1.5 px-4 pt-4">
            {routes.map((route) => (
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
                <Button 
                  onClick={handleLogin} 
                  variant="outline" 
                  disabled={isLoggingIn}
                  className="w-full bg-white text-primary border-none font-bold h-12 text-base rounded-xl active:scale-[0.98]"
                >
                  {isLoggingIn ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
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
