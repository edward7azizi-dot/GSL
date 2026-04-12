import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PlayerProfileForm from "@/components/player/PlayerProfileForm";

export default function EditProfileDialog({ open, onOpenChange, player }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <PlayerProfileForm player={player} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}