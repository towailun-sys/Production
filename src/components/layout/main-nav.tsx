
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useUser, useAuth, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, collection, query, where, getDocs, limit } from "firebase/firestore";
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
import { Player } from "@/lib/types";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";
import Image from "next/image";
import HHFCLogo from "@/app/lib/images/HHFCLogo.jpg";

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
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

  useEffect(() => {
    if (user) {
      const playersRef = collection(firestore, "players");
      getDocs(query(playersRef, limit(1)))
        .then(snapshot => {
          setIsFirstRun(snapshot.empty);
        })
        .catch(() => {
          setIsFirstRun(false);
        });
    } else {
      setIsFirstRun(false);
    }
  }, [user, firestore]);

  const playerRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "players", user.uid);
  }, [firestore, user]);
  const { data: currentPlayer, isLoading: isProfileLoading } = useDoc<Player>(playerRef);

  const normalizedUserEmail = user?.email?.trim().toLowerCase() || "";
  const emailMatchQuery = useMemoFirebase(() => {
    if (!user || currentPlayer) return null;
    return query(collection(firestore, "players"), where("email", "==", normalizedUserEmail), limit(1));
  }, [firestore, user, currentPlayer, normalizedUserEmail]);
  const { data: matchedProfiles, isLoading: isMatchedProfilesLoading } = useCollection<Player>(emailMatchQuery);

  const isUserSuperAdmin = !!user?.email && SUPER_ADMIN_EMAILS.includes(normalizedUserEmail);
  
  const isAuthDetermined = !isUserLoading && !isProfileLoading && (!emailMatchQuery || (matchedProfiles !== null && !isMatchedProfilesLoading)) && isFirstRun !== null;
  const isAuthorized = !!user && (!!currentPlayer || (matchedProfiles && matchedProfiles.length > 0) || isFirstRun === true || isUserSuperAdmin);
  const isAuthChecking = !!user && !isAuthDetermined;

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
      setIsOpen(false);
      router.push('/');
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast({
          variant: "destructive",
          title: dict.nav.signInError,
          description: error.message || "Could not complete Google authentication.",
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
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const baseRoutes = [
    { href: "/", label: dict.nav.dashboard, icon: LayoutDashboard, active: pathname === "/" },
    { href: "/attendance", label: dict.nav.attendance, icon: CheckCircle2, active: pathname === "/attendance" },
    { href: "/players", label: dict.nav.players, icon: Users, active: pathname === "/players" },
    { href: "/games", label: dict.nav.games, icon: Calendar, active: pathname === "/games", adminOnly: true },
  ];

  const routes = (currentPlayer && isAuthorized && !isAuthChecking) ? baseRoutes.filter(route => {
    if (route.adminOnly) return currentPlayer?.isAdmin;
    return true;
  }) : [];

  if (!mounted) return <nav className="sticky top-0 z-50 w-full border-b bg-primary h-16 shadow-lg" />;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white/20 bg-white group-hover:border-accent transition-colors flex items-center justify-center">
              <Image 
                src={HHFCLogo} 
                alt="HHFC Logo" 
                width={40} 
                height={40} 
                className="object-cover"
                priority
              />
            </div>
            <span className="font-headline text-lg md:text-xl font-bold tracking-tight whitespace-nowrap">{dict.nav.title}</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {routes.map((route) => (
              <Link key={route.href} href={route.href} className={cn("flex items-center gap-2 text-sm font-bold transition-all hover:text-accent", route.active ? "text-accent scale-105" : "text-primary-foreground/80")}>
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
                  <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('zh')}>中文</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isUserLoading || isAuthChecking ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-primary-foreground/20" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border-2 border-accent/30 hover:border-accent transition-all">
                      <Avatar className="h-full w-full">
                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">{user.displayName?.[0] || "U"}</AvatarFallback>
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
                <Button onClick={handleLogin} variant="outline" size="sm" disabled={isLoggingIn} className="bg-white text-primary hover:bg-accent hover:text-white border-none font-bold gap-2 h-9 px-4">
                  {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  {dict.nav.signIn}
                </Button>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-primary-foreground h-9 w-9 hover:bg-white/10 shrink-0">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t bg-primary pb-6">
          <div className="space-y-1.5 px-4 pt-4">
            {routes.map((route) => (
              <Link key={route.href} href={route.href} className={cn("flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-bold transition-all", route.active ? "bg-white/20 text-accent" : "text-primary-foreground/90")}>
                <route.icon className="h-5 w-5" />
                {route.label}
              </Link>
            ))}
            {!user && !isUserLoading && (
              <Button onClick={handleLogin} variant="outline" disabled={isLoggingIn} className="w-full bg-white text-primary border-none font-bold h-12 text-base mt-4">
                {dict.nav.signIn}
              </Button>
            )}
            {user && (
              <Button onClick={handleLogout} variant="ghost" className="w-full text-primary-foreground/80 justify-start gap-3 px-4 h-12 font-bold mt-4">
                <LogOut className="h-5 w-5 text-destructive" />
                {dict.nav.signOut}
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
