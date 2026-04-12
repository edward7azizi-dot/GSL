import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@/lib/AuthContext";
import { Player } from "@/lib/entities";
import PlayerOnboarding from "@/components/player/PlayerOnboarding";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [playerChecked, setPlayerChecked] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role === "admin" || !user.team_id) return;
    Player.filter({ user_email: user.email }).then(players => {
      const p = players[0];
      if (!p || !p.first_name || !p.last_name || !p.sub_position) {
        setShowOnboarding(true);
      }
    });
  }, [user?.email, user?.team_id]);

  return (
    <div className="min-h-screen bg-background">
      <PlayerOnboarding open={showOnboarding} onDone={() => setShowOnboarding(false)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}