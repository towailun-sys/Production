
"use client";

import { MainNav } from "@/components/layout/main-nav";
import { useTranslation } from "@/components/language-provider";

export default function AttendancePage() {
  const { dict } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-headline mb-4">{dict.attendance.title}</h1>
        <p className="text-muted-foreground">This functionality has been disabled.</p>
      </main>
    </div>
  );
}
