import React, { useState, useEffect } from "react";
import { Player } from "@/lib/entities";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const UNCLAIMED_EMAIL_PREFIX = "unclaimed-";

const isUnclaimed = (p) =>
  typeof p?.user_email === "string" && p.user_email.startsWith(UNCLAIMED_EMAIL_PREFIX);

export default function JerseyClaimDialog({ open, teamId, teamName, onClaimed, onFallback, onCancel }) {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep] = useState("enter"); // "enter" | "confirm"
  const [jersey, setJersey] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("enter");
      setJersey("");
      setAttempts(0);
      setErrorMsg("");
      setMatches([]);
      setSelectedId(null);
    }
  }, [open]);

  const handleLookup = async () => {
    if (!jersey.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const num = Number(jersey);
      if (!Number.isFinite(num)) {
        setErrorMsg("Please enter a valid number.");
        setLoading(false);
        return;
      }
      const rows = await Player.filter({ team_id: teamId, jersey_number: num });
      const unclaimed = rows.filter(isUnclaimed);

      if (unclaimed.length === 0) {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= 2) {
          // 2 failed tries → fall back to manual form
          onFallback?.();
          return;
        }
        setErrorMsg(`We don't see #${num} on ${teamName}'s roster. Double-check your number.`);
        setLoading(false);
        return;
      }

      setMatches(unclaimed);
      setSelectedId(unclaimed[0].id);
      setStep("confirm");
      setLoading(false);
    } catch (err) {
      console.error("JerseyClaimDialog lookup error:", err);
      setErrorMsg("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const picked = matches.find(m => m.id === selectedId);
    if (!picked) return;
    setLoading(true);
    try {
      await Player.update(picked.id, { user_email: user.email });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success(`Welcome, ${picked.full_name || picked.first_name}!`);
      onClaimed?.(picked);
    } catch (err) {
      console.error("JerseyClaimDialog confirm error:", err);
      toast.error("Couldn't claim that record. Please try again.");
      setLoading(false);
    }
  };

  const handleNotMe = () => {
    setStep("enter");
    setJersey("");
    setMatches([]);
    setSelectedId(null);
    setErrorMsg("");
    setLoading(false);
  };

  const handleNotOnList = () => onFallback?.();

  // X-out / close behavior — revert team join + sign out
  const handleClose = () => {
    if (loading) return;
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {step === "enter" ? "What's your jersey number?" : "Is this you?"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {step === "enter"
              ? `We'll match you to your spot on ${teamName}.`
              : `Confirm to link your account to your player record.`}
          </p>
        </DialogHeader>

        {step === "enter" ? (
          <div className="space-y-4 py-2">
            <Input
              type="number"
              autoFocus
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="e.g. 10"
              min={1}
              max={999}
              className="font-mono text-center text-2xl tracking-widest"
            />
            {errorMsg && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleLookup} disabled={!jersey.trim() || loading} className="w-full gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
              </Button>
              <Button variant="ghost" onClick={handleNotOnList} disabled={loading} className="w-full text-sm text-muted-foreground">
                I'm not on the roster
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {matches.length === 1 ? (
              <div className="rounded-lg border bg-primary/5 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Jersey #{matches[0].jersey_number}</p>
                <p className="text-xl font-bold mt-1">
                  {matches[0].full_name || `${matches[0].first_name} ${matches[0].last_name}`.trim()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{teamName}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We found {matches.length} players at #{matches[0].jersey_number}. Pick yourself:
                </p>
                {matches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedId === m.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-semibold">
                      {m.full_name || `${m.first_name} ${m.last_name}`.trim()}
                    </p>
                    <p className="text-xs text-muted-foreground">#{m.jersey_number}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleConfirm} disabled={loading || !selectedId} className="w-full gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, that's me
              </Button>
              <Button variant="outline" onClick={handleNotMe} disabled={loading} className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" /> No, try a different number
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
