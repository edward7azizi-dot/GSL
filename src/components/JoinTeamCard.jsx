import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Team } from "@/lib/entities";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, MessageCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function JoinTeamCard() {
  const { user, updateMe } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  const hasTeam = !!user?.team_id;
  const [teamLogo, setTeamLogo] = useState(null);

  useEffect(() => {
    if (user?.team_id && user.role !== 'admin' && user.team_id !== 'admin') {
      Team.filter({ id: user.team_id }).then(teams => {
        if (teams[0]?.logo_url) setTeamLogo(teams[0].logo_url);
      });
    }
  }, [user?.team_id]);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      // Find team by join code
      const teams = await Team.list();
      const match = teams.find(t => t.join_code?.trim().toUpperCase() === code.trim().toUpperCase());

      if (!match) {
        setStatus("error");
        setErrorMsg("Invalid code. Please check with your team manager.");
        return;
      }

      // Assign team to user (updateMe calls refreshUser internally)
      await updateMe({ team_id: match.id, team_name: match.name });

      // Close dialog and show success — onboarding dialog will open automatically
      handleClose();
      toast.success(`Welcome to ${match.name}! Let's set up your player profile.`);
    } catch (err) {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCode("");
    setStatus(null);
    setErrorMsg("");
  };

  // Already on a team — show team card
  if (hasTeam) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden">
              {teamLogo ? (
                <img src={teamLogo} alt={user.team_name} className="w-full h-full object-cover" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm">{user.team_name}</p>
              <p className="text-xs text-muted-foreground">Your team</p>
            </div>
          </div>
          <Link to="/TeamChat">
            <Button size="sm" variant="outline" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
              <MessageCircle className="w-4 h-4" /> Team Chat
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-dashed border-2 border-border hover:border-primary/40 transition-colors">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm">Not on a team yet</p>
              <p className="text-xs text-muted-foreground">Enter your team code to join</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 shrink-0">
            Join a Team
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Join a Team</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Enter the 8-character code provided by your team manager.
                </p>
                <Input
                  placeholder="e.g. SHEP3K2M"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="font-mono text-center text-lg tracking-widest uppercase"
                  onKeyDown={e => e.key === "Enter" && handleJoin()}
                />
                {status === "error" && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleJoin} disabled={!code.trim() || status === "loading"} className="gap-2">
                  {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Join Team
                </Button>
              </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}