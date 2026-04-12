import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Calendar, MapPin, BarChart3, Image } from "lucide-react";
import AdminTeams from "@/components/admin/AdminTeams";
import AdminGames from "@/components/admin/AdminGames";
import AdminPlayers from "@/components/admin/AdminPlayers";
import AdminLocations from "@/components/admin/AdminLocations";
import AdminMedia from "@/components/admin/AdminMedia";

export default function Admin() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Shield className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground text-sm">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">Manage teams, games, players, and locations</p>
      </div>

      <Tabs defaultValue="teams">
        <TabsList className="grid grid-cols-5 w-full max-w-xl">
          <TabsTrigger value="teams" className="gap-1.5 text-xs"><Users className="w-3 h-3" /> Teams</TabsTrigger>
          <TabsTrigger value="games" className="gap-1.5 text-xs"><Calendar className="w-3 h-3" /> Games</TabsTrigger>
          <TabsTrigger value="players" className="gap-1.5 text-xs"><BarChart3 className="w-3 h-3" /> Players</TabsTrigger>
          <TabsTrigger value="locations" className="gap-1.5 text-xs"><MapPin className="w-3 h-3" /> Locations</TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5 text-xs"><Image className="w-3 h-3" /> Media</TabsTrigger>
        </TabsList>
        <TabsContent value="teams"><AdminTeams /></TabsContent>
        <TabsContent value="games"><AdminGames /></TabsContent>
        <TabsContent value="players"><AdminPlayers /></TabsContent>
        <TabsContent value="locations"><AdminLocations /></TabsContent>
        <TabsContent value="media"><AdminMedia /></TabsContent>
      </Tabs>
    </div>
  );
}