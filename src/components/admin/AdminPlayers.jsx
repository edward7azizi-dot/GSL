import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PositionPicker from "@/components/player/PositionPicker";
import { Player, Team } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPlayers() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => Player.list() });
  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: () => Team.list() });

  const openEdit = (player) => {
    setEditing(player);
    setForm({
      first_name: player.first_name || "",
      last_name: player.last_name || "",
      full_name: player.full_name || "",
      team_id: player.team_id || "",
      jersey_number: player.jersey_number || 0,
      main_position: player.main_position || "",
      sub_position: player.sub_position || "",
      goals: player.goals || 0,
      assists: player.assists || 0,
      yellow_cards: player.yellow_cards || 0,
      red_cards: player.red_cards || 0,
      games_played: player.games_played || 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const team = teams.find(t => t.id === form.team_id);
    const full_name = `${form.first_name} ${form.last_name}`.trim() || form.full_name;
    const data = { ...form, full_name, team_name: team?.name || "" };
    await Player.update(editing.id, data);
    queryClient.invalidateQueries({ queryKey: ["players"] });
    toast.success("Player updated");
    setDialogOpen(false);
  };

  const handleDelete = async (player) => {
    if (!confirm(`Remove ${player.full_name}?`)) return;
    await Player.delete(player.id);
    queryClient.invalidateQueries({ queryKey: ["players"] });
    toast.success("Player removed");
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Players</h2>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">#</TableHead>
                <TableHead className="text-center">Pos</TableHead>
                <TableHead className="text-center">GP</TableHead>
                <TableHead className="text-center">G</TableHead>
                <TableHead className="text-center">A</TableHead>
                <TableHead className="text-center">YC</TableHead>
                <TableHead className="text-center">RC</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">{p.full_name}</TableCell>
                  <TableCell>{p.team_name || "—"}</TableCell>
                  <TableCell className="text-center">{p.jersey_number || "—"}</TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className="text-xs">{p.sub_position || p.main_position || "—"}</Badge></TableCell>
                  <TableCell className="text-center">{p.games_played || 0}</TableCell>
                  <TableCell className="text-center font-bold text-primary">{p.goals || 0}</TableCell>
                  <TableCell className="text-center">{p.assists || 0}</TableCell>
                  <TableCell className="text-center">{p.yellow_cards || 0}</TableCell>
                  <TableCell className="text-center">{p.red_cards || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDelete(p)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {players.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No players yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Player Stats</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name</Label><Input value={form.first_name || ""} onChange={e => set("first_name", e.target.value)} /></div>
            <div><Label>Last Name</Label><Input value={form.last_name || ""} onChange={e => set("last_name", e.target.value)} /></div>
            <div className="col-span-2">
              <Label>Team</Label>
              <Select value={form.team_id || ""} onValueChange={v => set("team_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="mb-2 block">Position</Label>
              <PositionPicker
                mainPosition={form.main_position}
                subPosition={form.sub_position}
                onChange={({ mainPosition, subPosition }) => { set("main_position", mainPosition); set("sub_position", subPosition); }}
              />
            </div>
            <div><Label>Jersey #</Label><Input type="number" value={form.jersey_number || 0} onChange={e => set("jersey_number", +e.target.value)} /></div>
            <div><Label>Games Played</Label><Input type="number" value={form.games_played || 0} onChange={e => set("games_played", +e.target.value)} /></div>
            <div><Label>Goals</Label><Input type="number" value={form.goals || 0} onChange={e => set("goals", +e.target.value)} /></div>
            <div><Label>Assists</Label><Input type="number" value={form.assists || 0} onChange={e => set("assists", +e.target.value)} /></div>
            <div><Label>Yellow Cards</Label><Input type="number" value={form.yellow_cards || 0} onChange={e => set("yellow_cards", +e.target.value)} /></div>
            <div><Label>Red Cards</Label><Input type="number" value={form.red_cards || 0} onChange={e => set("red_cards", +e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}