import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Player } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

const UNCLAIMED_EMAIL_PREFIX = "unclaimed-";
const isUnclaimed = (p) =>
  typeof p?.user_email === "string" && p.user_email.startsWith(UNCLAIMED_EMAIL_PREFIX);

export default function AdminReviewBanner({ players }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const flagged = players.filter((p) => p.needs_review);
  if (flagged.length === 0) return null;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["players"] });

  // Keep this flagged signup, mark as reviewed (clears the banner row).
  const handleKeepSeparate = async (flaggedPlayer) => {
    setBusyId(flaggedPlayer.id);
    try {
      await Player.update(flaggedPlayer.id, { needs_review: false });
      toast.success("Marked as reviewed");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  // Merge: claim an unclaimed roster spot using the flagged player's real email,
  // then delete the flagged duplicate.
  const handleMerge = async (flaggedPlayer, unclaimedSpot) => {
    setBusyId(flaggedPlayer.id);
    try {
      await Player.update(unclaimedSpot.id, {
        user_email: flaggedPlayer.user_email,
        first_name: flaggedPlayer.first_name || unclaimedSpot.first_name,
        last_name: flaggedPlayer.last_name || unclaimedSpot.last_name,
        full_name:
          flaggedPlayer.full_name ||
          `${flaggedPlayer.first_name || ""} ${flaggedPlayer.last_name || ""}`.trim() ||
          unclaimedSpot.full_name,
        main_position: flaggedPlayer.main_position || unclaimedSpot.main_position,
        sub_position: flaggedPlayer.sub_position || unclaimedSpot.sub_position,
      });
      await Player.delete(flaggedPlayer.id);
      toast.success(`Merged into ${unclaimedSpot.full_name || `#${unclaimedSpot.jersey_number}`}`);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Merge failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (flaggedPlayer) => {
    if (!confirm(`Delete ${flaggedPlayer.full_name || flaggedPlayer.user_email}?`)) return;
    setBusyId(flaggedPlayer.id);
    try {
      await Player.delete(flaggedPlayer.id);
      toast.success("Deleted");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="p-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-sm">
              {flagged.length} {flagged.length === 1 ? "player needs" : "players need"} review
            </span>
            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-700">
              Fallback signups
            </Badge>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4">
            {flagged.map((fp) => {
              const candidates = players.filter(
                (p) => p.team_id === fp.team_id && isUnclaimed(p),
              );
              const busy = busyId === fp.id;
              return (
                <div key={fp.id} className="rounded-lg border bg-background p-3 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">New signup</p>
                      <p className="font-semibold">{fp.full_name || `${fp.first_name} ${fp.last_name}`}</p>
                      <p className="text-xs text-muted-foreground">{fp.user_email}</p>
                      <p className="text-xs mt-1">
                        {fp.team_name} · #{fp.jersey_number ?? "—"} · {fp.main_position || "?"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Unclaimed roster spots on {fp.team_name || "this team"} ({candidates.length})
                      </p>
                      {candidates.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No unclaimed spots on this team.</p>
                      ) : (
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {candidates.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleMerge(fp, c)}
                              disabled={busy}
                              className="w-full text-left text-xs rounded border px-2 py-1.5 hover:bg-primary/5 disabled:opacity-50 flex items-center justify-between gap-2"
                            >
                              <span className="truncate">
                                <span className="font-mono mr-2">#{c.jersey_number}</span>
                                {c.full_name || `${c.first_name} ${c.last_name}`.trim() || c.user_email}
                              </span>
                              <span className="text-primary text-xs font-semibold shrink-0">Merge →</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => handleKeepSeparate(fp)}
                      className="gap-1.5"
                    >
                      {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                      Keep separate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => handleDelete(fp)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Click a roster spot above to merge.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
