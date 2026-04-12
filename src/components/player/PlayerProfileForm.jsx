import React, { useState } from "react";
import { Player } from "@/lib/entities";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PositionPicker from "@/components/player/PositionPicker";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PlayerProfileForm({ player, onDone, isOnboarding = false }) {
  const { user, checkAppState, updateMe } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    first_name: player?.first_name || "",
    last_name: player?.last_name || "",
    jersey_number: player?.jersey_number || "",
    main_position: player?.main_position || "",
    sub_position: player?.sub_position || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      toast.error("First and last name are required.");
      return;
    }
    if (!form.main_position || !form.sub_position) {
      toast.error("Please select your position.");
      return;
    }

    setSaving(true);
    try {
      const full_name = `${form.first_name} ${form.last_name}`.trim();
      const data = {
        ...form,
        full_name,
        jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
      };

      if (player?.id) {
        await Player.update(player.id, data);
      } else {
        await Player.create({
          ...data,
          user_email: user.email,
          team_id: user.team_id || null,
          team_name: user.team_name || null,
          goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, games_played: 0,
        });
      }

      await updateMe({ full_name });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Profile saved!");
      if (onDone) onDone();
    } catch (err) {
      console.error("PlayerProfileForm save error:", err);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>First Name</Label>
          <Input value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="e.g. John" />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="e.g. Smith" />
        </div>
      </div>

      <div>
        <Label>Jersey Number</Label>
        <Input
          type="number"
          value={form.jersey_number}
          onChange={e => set("jersey_number", e.target.value)}
          placeholder="e.g. 10"
          min={1} max={99}
          className="w-32"
        />
      </div>

      <div>
        <Label className="mb-2 block">Position</Label>
        <PositionPicker
          mainPosition={form.main_position}
          subPosition={form.sub_position}
          onChange={({ mainPosition, subPosition }) => {
            set("main_position", mainPosition);
            set("sub_position", subPosition);
          }}
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {isOnboarding ? "Complete Setup" : "Save Changes"}
      </Button>
    </div>
  );
}