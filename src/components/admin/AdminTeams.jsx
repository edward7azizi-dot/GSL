import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Team } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

const emptyTeam = { name: "", captain: "", join_code: "", color: "#22c55e", wins: 0, losses: 0, draws: 0, goals_for: 0, goals_against: 0, points: 0 };

export default function AdminTeams() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTeam);

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => Team.list(),
  });

  const openCreate = () => { setEditing(null); setForm(emptyTeam); setDialogOpen(true); };
  const openEdit = (team) => { setEditing(team); setForm({ name: team.name, captain: team.captain || "", join_code: team.join_code, color: team.color || "#22c55e", wins: team.wins || 0, losses: team.losses || 0, draws: team.draws || 0, goals_for: team.goals_for || 0, goals_against: team.goals_against || 0, points: team.points || 0 }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.join_code) { toast.error("Name and join code are required."); return; }
    if (editing) {
      await Team.update(editing.id, form);
      toast.success("Team updated");
    } else {
      await Team.create(form);
      toast.success("Team created");
    }
    queryClient.invalidateQueries({ queryKey: ["teams"] });
    setDialogOpen(false);
  };

  const handleDelete = async (team) => {
    if (!confirm(`Delete ${team.name}?`)) return;
    await Team.delete(team.id);
    queryClient.invalidateQueries({ queryKey: ["teams"] });
    toast.success("Team deleted");
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Teams</h2>
        <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Team</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Captain</TableHead>
                <TableHead>Join Code</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">D</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">PTS</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map(team => (
                <TableRow key={team.id}>
                  <TableCell className="font-semibold">{team.name}</TableCell>
                  <TableCell>{team.captain || "—"}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{team.join_code}</span>
                    <Button variant="ghost" size="icon" className="w-6 h-6 ml-1" onClick={() => { navigator.clipboard.writeText(team.join_code); toast.success("Copied!"); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">{team.wins || 0}</TableCell>
                  <TableCell className="text-center">{team.draws || 0}</TableCell>
                  <TableCell className="text-center">{team.losses || 0}</TableCell>
                  <TableCell className="text-center font-bold">{team.points || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(team)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDelete(team)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {teams.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No teams yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Team" : "Create Team"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Team Name</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
            <div><Label>Captain</Label><Input value={form.captain} onChange={e => set("captain", e.target.value)} /></div>
            <div><Label>Join Code</Label><Input value={form.join_code} onChange={e => set("join_code", e.target.value)} className="font-mono" /></div>
            <div><Label>Wins</Label><Input type="number" value={form.wins} onChange={e => set("wins", +e.target.value)} /></div>
            <div><Label>Draws</Label><Input type="number" value={form.draws} onChange={e => set("draws", +e.target.value)} /></div>
            <div><Label>Losses</Label><Input type="number" value={form.losses} onChange={e => set("losses", +e.target.value)} /></div>
            <div><Label>Points</Label><Input type="number" value={form.points} onChange={e => set("points", +e.target.value)} /></div>
            <div><Label>Goals For</Label><Input type="number" value={form.goals_for} onChange={e => set("goals_for", +e.target.value)} /></div>
            <div><Label>Goals Against</Label><Input type="number" value={form.goals_against} onChange={e => set("goals_against", +e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}