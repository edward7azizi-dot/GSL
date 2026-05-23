import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PlayerProfileForm from "@/components/player/PlayerProfileForm";

export default function PlayerOnboarding({ open, onClose, needsReview = false, pendingTeam = null }) {
  // onClose receives a boolean: true = saved successfully, false = X'd out.
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(false); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Welcome to GSL! 👋</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {needsReview
              ? "We couldn't find you on the imported roster — fill in your details and a league admin will confirm."
              : "Let's set up your player profile before you get started."}
          </p>
        </DialogHeader>
        <PlayerProfileForm
          isOnboarding={true}
          needsReview={needsReview}
          pendingTeam={pendingTeam}
          onDone={() => onClose?.(true)}
        />
      </DialogContent>
    </Dialog>
  );
}
