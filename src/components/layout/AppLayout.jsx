import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@/lib/AuthContext";
import { usePendingTeam } from "@/lib/PendingTeamContext";
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
  const { user, updateMe, refreshUser } = useAuth();
  const { pendingTeam, clearPendingTeam } = usePendingTeam();
  const queryClient = useQueryClient();

  // Which team should the onboarding flow target? Prefer the in-flight pendingTeam
  // (fresh join, not yet committed); fall back to profile.team_id for users whose
  // previous session committed a team but never finished onboarding.
  const onboardingTeamId = pendingTeam?.id || user?.team_id || null;
  const onboardingTeamName = pendingTeam?.name || user?.team_name || null;

  useEffect(() => {
    if (!user || user.role === "admin" || !onboardingTeamId) {
      setShowClaim(false);
      setShowOnboarding(false);
      return;
    }
    let cancelled = false;

    (async () => {
      // Already onboarded for this account? Skip everything.
      const mine = await Player.filter({ user_email: user.email });
      const p = mine[0];
      if (p && p.first_name && p.last_name && p.sub_position) return;
      if (cancelled) return;

      // Any unclaimed records on the target team?
      const teamPlayers = await Player.filter({ team_id: onboardingTeamId });
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
  }, [user?.email, onboardingTeamId, user?.role]);

  // After a successful claim, commit the team to the profile and refresh.
  const handleClaimed = async () => {
    setShowClaim(false);
    if (pendingTeam) {
      try {
        await updateMe({ team_id: pendingTeam.id, team_name: pendingTeam.name });
      } catch (err) {
        console.error("AppLayout: failed to commit team on claim", err);
      }
      clearPendingTeam();
    }
    await refreshUser();
    queryClient.invalidateQueries({ queryKey: ["players"] });
  };

  // Jersey not on roster → fall back to manual form. Keep pendingTeam so the form
  // knows which team to save against; the form commits the team_id on successful save.
  const handleClaimFallback = () => {
    setShowClaim(false);
    setOnboardingNeedsReview(true);
    setShowOnboarding(true);
  };

  // X-out of the claim dialog — discard the in-flight join. If there's a stale
  // profile.team_id from a previous incomplete session, null it so they're not
  // stuck showing as a team member without a player record.
  const handleClaimCancel = async () => {
    setShowClaim(false);
    clearPendingTeam();
    if (user?.team_id) {
      try {
        await updateMe({ team_id: null, team_name: null });
      } catch (err) {
        console.error("AppLayout: failed to clear stale team on claim cancel", err);
      }
    }
  };

  // X-out of the manual form (PlayerOnboarding) — same discard behavior.
  const handleOnboardingClose = async (saved) => {
    setShowOnboarding(false);
    if (saved) {
      // PlayerProfileForm committed team_id itself on save — just refresh state.
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["players"] });
      return;
    }
    // Closed without saving: discard the in-flight team.
    clearPendingTeam();
    if (user?.team_id) {
      try {
        await updateMe({ team_id: null, team_name: null });
      } catch (err) {
        console.error("AppLayout: failed to clear stale team on onboarding close", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <JerseyClaimDialog
        open={showClaim}
        teamId={onboardingTeamId}
        teamName={onboardingTeamName}
        onClaimed={handleClaimed}
        onFallback={handleClaimFallback}
        onCancel={handleClaimCancel}
      />
      <PlayerOnboarding
        open={showOnboarding}
        needsReview={onboardingNeedsReview}
        pendingTeam={pendingTeam}
        onClose={handleOnboardingClose}
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
