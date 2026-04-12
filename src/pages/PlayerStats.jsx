import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Player } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Target, Shirt } from "lucide-react";

export default function PlayerStats() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("goals");

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: () => Player.list(),
  });

  const filtered = players
    .filter(p => {
      const matchesSearch = p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.team_name?.toLowerCase().includes(search.toLowerCase());
      const matchesSort = sortBy === "clean_sheets" ? p.main_position === "GK" : true;
      return matchesSearch && matchesSort;
    })
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Player Stats</h1>
        <p className="text-muted-foreground text-sm">Individual player statistics</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search players or teams..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="goals">Sort by Goals</SelectItem>
            <SelectItem value="assists">Sort by Assists</SelectItem>
            <SelectItem value="games_played">Sort by Games</SelectItem>
            <SelectItem value="yellow_cards">Sort by Yellow Cards</SelectItem>
            <SelectItem value="red_cards">Sort by Red Cards</SelectItem>
            <SelectItem value="clean_sheets">Sort by Clean Sheets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-center p-3 pl-5 font-semibold text-muted-foreground">#</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Player</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Team</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">Pos</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">GP</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">G</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">A</th>
                    <th className="text-center p-3 font-semibold text-yellow-400">YC</th>
                    <th className="text-center p-3 font-semibold text-red-500">RC</th>
                    <th className="text-center p-3 pr-5 font-semibold text-muted-foreground">CS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((player, idx) => (
                    <tr key={player.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 pl-5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mx-auto">
                          {player.jersey_number || <Shirt className="w-3 h-3" />}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold">{player.full_name}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{player.team_name || "—"}</td>
                      <td className="text-center p-3">
                       <Badge variant="outline" className={`text-xs ${
                         player.main_position === 'Defender' ? 'bg-red-50 text-red-700 border-red-300' :
                         player.main_position === 'Midfielder' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                         player.main_position === 'Attacker' ? 'bg-green-50 text-green-700 border-green-300' :
                         'bg-muted text-muted-foreground'
                       }`}>{player.sub_position || player.main_position || "—"}</Badge>
                      </td>
                      <td className="text-center p-3">{player.games_played || 0}</td>
                      <td className="text-center p-3 font-bold text-primary">{player.goals || 0}</td>
                      <td className="text-center p-3 font-medium">{player.assists || 0}</td>
                      <td className="text-center p-3 font-medium">{player.yellow_cards || 0}</td>
                      <td className="text-center p-3 font-medium">{player.red_cards || 0}</td>
                      <td className="text-center p-3 pr-5 font-medium">
                        {player.main_position === 'GK' ? (player.clean_sheets || 0) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="p-8 text-center text-muted-foreground">No players found.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}