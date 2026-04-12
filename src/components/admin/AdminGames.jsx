import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Game, Team, Location } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import GameCompletionForm from "@/components/admin/GameCompletionForm";

const emptyGame = {
  home_team_id: "", away_team_id: "",
  date: "", time: "",
  location_id: "", location_name: "",
  home_score: 0, away_score: 0,
  status: "scheduled",
};

function TimePicker({ value, onChange }) {
  // Parse existing value like "7:00 PM"
  const parse = (v) => {
    const match = v?.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) return { hour: parseInt(match[1]), minute: parseInt(match[2]), ampm: match[3].toUpperCase() };
    return { hour: 7, minute: 0, ampm: "PM" };
  };
  const { hour, minute, ampm } = parse(value);
  const format12 = (h, m, ap) => `${h}:${String(m).padStart(2, "0")} ${ap}`;
  const setHour = (h) => onChange(format12(h, minute, ampm));
  const setMinute = (m) => onChange(format12(hour, m, ampm));
  const setAmpm = (ap) => onChange(format12(hour, minute, ap));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{hour}:{String(minute).padStart(2, "0")} {ampm}</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setAmpm("AM")} className={`px-3 py-1 rounded-l-lg text-xs font-bold border transition-all ${ampm === "AM" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>AM</button>
          <button type="button" onClick={() => setAmpm("PM")} className={`px-3 py-1 rounded-r-lg text-xs font-bold border transition-all ${ampm === "PM" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>PM</button>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Hour</p>
        <input type="range" min={1} max={12} value={hour} onChange={e => setHour(+e.target.value)} className="w-full accent-primary" />
        <div className="flex justify-between text-[10px] text-muted-foreground"><span>1</span><span>6</span><span>12</span></div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Minute</p>
        <input type="range" min={0} max={55} step={5} value={minute} onChange={e => setMinute(+e.target.value)} className="w-full accent-primary" />
        <div className="flex justify-between text-[10px] text-muted-foreground"><span>:00</span><span>:30</span><span>:55</span></div>
      </div>
    </div>
  );
}

export default function AdminGames() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyGame);
  const [completingGame, setCompletingGame] = useState(null);

  const { data: games = [] } = useQuery({ queryKey: ["games"], queryFn: () => Game.list("date", 200) });
  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: () => Team.list() });
  const { data: locations = [] } = useQuery({ queryKey: ["locations"], queryFn: () => Location.list() });

  const getTeamName = (id) => teams.find(t => t.id === id)?.name || "—";

  const openCreate = () => { setEditing(null); setForm(emptyGame); setDialogOpen(true); };
  const openEdit = (game) => {
    setEditing(game);
    setForm({
      home_team_id: game.home_team_id || "",
      away_team_id: game.away_team_id || "",
      date: game.date || "",
      time: game.time || "7:00 PM",
      location_id: game.location_id || "",
      location_name: game.location_name || "",
      home_score: game.home_score || 0,
      away_score: game.away_score || 0,
      status: game.status || "scheduled",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const homeTeam = teams.find(t => t.id === form.home_team_id);
    const awayTeam = teams.find(t => t.id === form.away_team_id);
    const data = {
      ...form,
      home_team_name: homeTeam?.name || "",
      away_team_name: awayTeam?.name || "",
    };
    if (editing) {
      await Game.update(editing.id, data);
      toast.success("Game updated");
    } else {
      await Game.create(data);
      toast.success("Game created");
    }
    queryClient.invalidateQueries({ queryKey: ["games"] });
    setDialogOpen(false);
  };

  const handleDelete = async (game) => {
    if (!confirm("Delete this game?")) return;
    await Game.delete(game.id);
    queryClient.invalidateQueries({ queryKey: ["games"] });
    toast.success("Game deleted");
  };

  const handleLocationSelect = (locId) => {
    const loc = locations.find(l => l.id === locId);
    setForm(prev => ({
      ...prev,
      location_id: locId,
      location_name: loc?.name || "",
    }));
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Auto status: if scheduled and game date+time has passed, mark in_progress
  const getEffectiveStatus = (game) => {
    if (game.status !== "scheduled" || !game.date || !game.time) return game.status;
    const match = game.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return game.status;
    let h = parseInt(match[1]); const m = parseInt(match[2]); const ap = match[3].toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    const gameDateTime = new Date(game.date + "T" + String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0") + ":00");
    return new Date() >= gameDateTime ? "in_progress" : "scheduled";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Games</h2>
        <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Game</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Home</TableHead>
                <TableHead>Away</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map(game => {
                const effectiveStatus = getEffectiveStatus(game);
                return (
                <TableRow key={game.id}>
                  <TableCell className="font-semibold">{game.home_team_name || getTeamName(game.home_team_id)}</TableCell>
                  <TableCell className="font-semibold">{game.away_team_name || getTeamName(game.away_team_id)}</TableCell>
                  <TableCell className="text-sm">{game.date ? format(new Date(game.date), "MMM d") : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{game.time || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{game.location_name || "—"}</TableCell>
                  <TableCell className="font-bold">{game.status === "completed" ? `${game.home_score} – ${game.away_score}` : "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{effectiveStatus?.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(game)}><Pencil className="w-3 h-3" /></Button>
                      {game.status !== "completed" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-green-600" title="Mark as Done" onClick={() => setCompletingGame(game)}><CheckCircle2 className="w-3 h-3" /></Button>
                      )}
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDelete(game)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
              {games.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No games yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Game" : "Create Game"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Home Team</Label>
              <Select value={form.home_team_id} onValueChange={v => set("home_team_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Away Team</Label>
              <Select value={form.away_team_id} onValueChange={v => set("away_team_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer" /></div>
            <div className="col-span-2">
              <Label>Time</Label>
              <div className="mt-2 p-3 border rounded-lg bg-muted/30">
                <TimePicker value={form.time || "7:00 PM"} onChange={v => set("time", v)} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="postponed">Postponed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 border-t pt-3 space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Venue</p>
              <div>
                <Label>Location</Label>
                <Select value={form.location_id} onValueChange={handleLocationSelect}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div><Label>Home Score</Label><Input type="number" value={form.home_score} onChange={e => set("home_score", +e.target.value)} /></div>
              <div><Label>Away Score</Label><Input type="number" value={form.away_score} onChange={e => set("away_score", +e.target.value)} /></div>
            </div>
          </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {completingGame && (
        <GameCompletionForm
          game={completingGame}
          onClose={() => setCompletingGame(null)}
        />
      )}
    </div>
  );
}