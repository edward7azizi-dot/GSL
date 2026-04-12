import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Game, Player, Team } from "@/lib/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function PlayerStatRow({ player, stats, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const isGK = player.main_position === "GK";
  const s = stats[player.id] || {};
  const set = (field, val) => onChange(player.id, field, Math.max(0, parseInt(val) || 0));

  const statFields = [
    { field: "goals", label: "Goals", color: "text-green-600" },
    { field: "assists", label: "Assists", color: "text-blue-600" },
    { field: "yellow_cards", label: "Yellow Cards", color: "text-yellow-600" },
    { field: "red_cards", label: "Red Cards", color: "text-red-600" },
    ...(isGK ? [{ field: "clean_sheets", label: "Clean Sheets", color: "text-purple-600" }] : []),
  ];

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 py-2 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
          {player.jersey_number || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{player.full_name || `${player.first_name} ${player.last_name}`}</p>
          <p className="text-xs text-muted-foreground">{player.sub_position || player.main_position}</p>
        </div>
        <div className="flex items-center gap-2 mr-1">
          {statFields.map(sf => (s[sf.field] || 0) > 0 && (
            <span key={sf.field} className={`text-xs font-semibold ${sf.color}`}>{sf.label.slice(0,1)}{s[sf.field]}</span>
          ))}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="pb-3 px-2 grid grid-cols-2 gap-3">
          {statFields.map(sf => (
            <div key={sf.field}>
              <label className={`text-xs font-semibold ${sf.color} block mb-1`}>{sf.label}</label>
              <Input
                type="number"
                min="0"
                value={s[sf.field] || 0}
                onChange={e => set(sf.field, e.target.value)}
                className="h-8 text-center"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GameCompletionForm({ game, onClose }) {
  const queryClient = useQueryClient();
  const [homeScore, setHomeScore] = useState(game?.home_score ?? 0);
  const [awayScore, setAwayScore] = useState(game?.away_score ?? 0);
  const [playerStats, setPlayerStats] = useState({});
  const [saving, setSaving] = useState(false);

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => Player.list(),
  });

  const homePlayers = allPlayers.filter(p => p.team_id === game?.home_team_id);
  const awayPlayers = allPlayers.filter(p => p.team_id === game?.away_team_id);

  const handleStatChange = (playerId, field, value) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] || {}), [field]: value },
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);

    // Update game
    await Game.update(game.id, {
      status: "completed",
      home_score: homeScore,
      away_score: awayScore,
    });

    // Update each player's stats
    await Promise.all(
      Object.entries(playerStats).map(([playerId, stats]) => {
        const player = allPlayers.find(p => p.id === playerId);
        if (!player) return Promise.resolve();
        return Player.update(playerId, {
          goals: (player.goals || 0) + (stats.goals || 0),
          assists: (player.assists || 0) + (stats.assists || 0),
          yellow_cards: (player.yellow_cards || 0) + (stats.yellow_cards || 0),
          red_cards: (player.red_cards || 0) + (stats.red_cards || 0),
          clean_sheets: (player.clean_sheets || 0) + (stats.clean_sheets || 0),
          games_played: (player.games_played || 0) + 1,
        });
      })
    );

    // Update team standings
    const homeTeam = await Team.filter({ id: game.home_team_id }).then(r => r[0]);
    const awayTeam = await Team.filter({ id: game.away_team_id }).then(r => r[0]);

    if (homeTeam && awayTeam) {
      const homeWin = homeScore > awayScore;
      const awayWin = awayScore > homeScore;
      const draw = homeScore === awayScore;

      const homeCards = homePlayers.reduce((acc, p) => {
        const s = playerStats[p.id] || {};
        acc.yellow += s.yellow_cards || 0;
        acc.red += s.red_cards || 0;
        return acc;
      }, { yellow: 0, red: 0 });

      const awayCards = awayPlayers.reduce((acc, p) => {
        const s = playerStats[p.id] || {};
        acc.yellow += s.yellow_cards || 0;
        acc.red += s.red_cards || 0;
        return acc;
      }, { yellow: 0, red: 0 });

      await Team.update(homeTeam.id, {
        wins: (homeTeam.wins || 0) + (homeWin ? 1 : 0),
        losses: (homeTeam.losses || 0) + (awayWin ? 1 : 0),
        draws: (homeTeam.draws || 0) + (draw ? 1 : 0),
        goals_for: (homeTeam.goals_for || 0) + homeScore,
        goals_against: (homeTeam.goals_against || 0) + awayScore,
        points: (homeTeam.points || 0) + (homeWin ? 3 : draw ? 1 : 0),
        yellow_cards_total: (homeTeam.yellow_cards_total || 0) + homeCards.yellow,
        red_cards_total: (homeTeam.red_cards_total || 0) + homeCards.red,
      });

      await Team.update(awayTeam.id, {
        wins: (awayTeam.wins || 0) + (awayWin ? 1 : 0),
        losses: (awayTeam.losses || 0) + (homeWin ? 1 : 0),
        draws: (awayTeam.draws || 0) + (draw ? 1 : 0),
        goals_for: (awayTeam.goals_for || 0) + awayScore,
        goals_against: (awayTeam.goals_against || 0) + homeScore,
        points: (awayTeam.points || 0) + (awayWin ? 3 : draw ? 1 : 0),
        yellow_cards_total: (awayTeam.yellow_cards_total || 0) + awayCards.yellow,
        red_cards_total: (awayTeam.red_cards_total || 0) + awayCards.red,
      });
    }

    queryClient.invalidateQueries({ queryKey: ["games"] });
    queryClient.invalidateQueries({ queryKey: ["players"] });
    queryClient.invalidateQueries({ queryKey: ["teams"] });

    setSaving(false);
    toast.success("Game completed! Stats updated.");
    onClose();
  };

  if (!game) return null;

  return (
    <Dialog open={!!game} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Game</DialogTitle>
        </DialogHeader>

        {/* Score Input */}
        <div className="flex items-center gap-4 justify-center py-4 bg-muted/30 rounded-xl">
          <div className="text-center">
            <p className="text-sm font-semibold mb-2">{game.home_team_name}</p>
            <Input
              type="number"
              min="0"
              value={homeScore}
              onChange={e => setHomeScore(+e.target.value)}
              className="w-20 text-center text-2xl font-bold h-14"
            />
          </div>
          <span className="text-2xl font-black text-muted-foreground mt-6">–</span>
          <div className="text-center">
            <p className="text-sm font-semibold mb-2">{game.away_team_name}</p>
            <Input
              type="number"
              min="0"
              value={awayScore}
              onChange={e => setAwayScore(+e.target.value)}
              className="w-20 text-center text-2xl font-bold h-14"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">Click stat buttons to increment. Click again to add more.</p>

        {/* Players */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Home team */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary/10 text-primary text-xs">{game.home_team_name}</Badge>
            </div>
            {homePlayers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No players registered.</p>
            ) : (
              homePlayers.map(p => (
                <PlayerStatRow key={p.id} player={p} stats={playerStats} onChange={handleStatChange} />
              ))
            )}
          </div>

          {/* Away team */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-secondary text-secondary-foreground text-xs">{game.away_team_name}</Badge>
            </div>
            {awayPlayers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No players registered.</p>
            ) : (
              awayPlayers.map(p => (
                <PlayerStatRow key={p.id} player={p} stats={playerStats} onChange={handleStatChange} />
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : "Confirm & Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}