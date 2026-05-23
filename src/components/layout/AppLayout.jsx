import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@/lib/AuthContext";
import { Player } from "@/lib/entities";
import PlayerOnboarding from "@/components/player/PlayerOnboarding";
import JerseyClaimDialog from "@/components/player/JerseyClaimDialog";
import { useQueryClient } from "@tanstack/react-query";

const UNCLAIMED_EMAIL_PREFIX = "unclaimed-";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingNeedsReview, setOnboardingNeedsReview] = useState(false);
  const { user, updateMe, logout, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || user.role === "admin" || !user.team_id) return;
    let cancelled = false;

    (async () => {
      // Already onboarded? Skip.
      const mine = await Player.filter({ user_email: user.email });
      const p = mine[0];
      if (p && p.first_name && p.last_name && p.sub_position) return;
      if (cancelled) return;

      // Any unclaimed records on this team?
      const teamPlayers = await Player.filter({ team_id: user.team_id });
      const hasUnclaimed = teamPlayers.some(
        (pl) => typeof pl.user_email === "string" && pl.user_email.startsWith(UNCLAIMED_EMAIL_PREFIX),
      );
      if (cancelled) return;

      if (hasUnclaimed) {
        setShowClaim(true);
      } else {
        // Brand new team / no roster imported — go straight to manual form, no flag.
        setOnboardingNeedsReview(false);
        setShowOnboarding(true);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.email, user?.team_id]);

  const handleClaimed = async () => {
    setShowClaim(false);
    await refreshUser();
    queryClient.invalidateQueries({ queryKey: ["players"] });
  };

  // Player wasn't on the imported roster — fall back to manual form, flag for review.
  const handleClaimFallback = () => {
    setShowClaim(false);
    setOnboardingNeedsReview(true);
    setShowOnboarding(true);
  };

  // X-out: revert team join and sign out so user has to re-enter team code.
  const handleClaimCancel = async () => {
    setShowClaim(false);
    try {
      await updateMe({ team_id: null, team_name: null });
    } catch (err) {
      console.error("AppLayout: failed to revert team on claim cancel", err);
    }
    await logout();
    window.location.href = "/Login";
  };

  return (
    <div className="min-h-screen bg-background">
      <JerseyClaimDialog
        open={showClaim}
        teamId={user?.team_id}
        teamName={user?.team_name}
        onClaimed={handleClaimed}
        onFallback={handleClaimFallback}
        onCancel={handleClaimCancel}
      />
      <PlayerOnboarding
        open={showOnboarding}
        needsReview={onboardingNeedsReview}
        onDone={() => setShowOnboarding(false)}
      />
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
