import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Team, Game } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function Standings() {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => Team.list(),
  });

  const { data: allGames = [] } = useQuery({
    queryKey: ["games"],
    queryFn: () => Game.list(),
  });

  const completedGames = allGames.filter(g => g.status === "completed");

  // Derive W/D/L/GF/GA/PTS per team from completed games. 3 pts win, 1 draw, 0 loss.
  // Source of truth is the games table — keeps standings in sync when results are edited.
  const stats = React.useMemo(() => {
    const s = {};
    for (const t of teams) {
      s[t.id] = { wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, points: 0 };
    }
    for (const g of completedGames) {
      const home = s[g.home_team_id];
      const away = s[g.away_team_id];
      if (!home || !away) continue;
      const hs = g.home_score ?? 0;
      const as = g.away_score ?? 0;
      home.goals_for += hs; home.goals_against += as;
      away.goals_for += as; away.goals_against += hs;
      if (hs > as) { home.wins++; home.points += 3; away.losses++; }
      else if (as > hs) { away.wins++; away.points += 3; home.losses++; }
      else { home.draws++; away.draws++; home.points++; away.points++; }
    }
    return s;
  }, [teams, completedGames]);

  const statsOf = (team) => stats[team.id] || { wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, points: 0 };

  const h2hPoints = (games, teamA, teamB) => {
    let pts = 0;
    for (const g of games) {
      const isHome = g.home_team_id === teamA.id && g.away_team_id === teamB.id;
      const isAway = g.away_team_id === teamA.id && g.home_team_id === teamB.id;
      if (!isHome && !isAway) continue;
      const aScore = isHome ? g.home_score : g.away_score;
      const bScore = isHome ? g.away_score : g.home_score;
      pts += aScore > bScore ? 3 : aScore === bScore ? 1 : 0;
    }
    return pts;
  };

  const sorted = [...teams].sort((a, b) => {
    const sa = statsOf(a), sb = statsOf(b);
    // 1. Points
    if (sb.points !== sa.points) return sb.points - sa.points;
    // 2. Goal difference
    const gdA = sa.goals_for - sa.goals_against;
    const gdB = sb.goals_for - sb.goals_against;
    if (gdB !== gdA) return gdB - gdA;
    // 3. Goals for
    if (sb.goals_for !== sa.goals_for) return sb.goals_for - sa.goals_for;
    // 4. Goals against (fewer = better)
    if (sa.goals_against !== sb.goals_against) return sa.goals_against - sb.goals_against;
    // 5. Head-to-head
    const h2hDiff = h2hPoints(completedGames, b, a) - h2hPoints(completedGames, a, b);
    if (h2hDiff !== 0) return h2hDiff;
    // 6. Red cards (fewer = better)
    if ((a.red_cards_total || 0) !== (b.red_cards_total || 0)) return (a.red_cards_total || 0) - (b.red_cards_total || 0);
    // 7. Yellow cards (fewer = better)
    return (a.yellow_cards_total || 0) - (b.yellow_cards_total || 0);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Standings</h1>
        <p className="text-muted-foreground text-sm">Current league table</p>
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
                    <th className="text-left p-3 pl-5 font-semibold text-muted-foreground w-10">#</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Team</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">GP</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">W</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">D</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">L</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">GF</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">GA</th>
                    <th className="text-center p-3 font-semibold text-muted-foreground">GD</th>
                    <th className="text-center p-3 pr-5 font-semibold text-muted-foreground">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((team, idx) => {
                    const ts = statsOf(team);
                    const gp = ts.wins + ts.draws + ts.losses;
                    const gd = ts.goals_for - ts.goals_against;
                    return (
                      <tr key={team.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 pl-5">
                          {idx === 0 ? <Trophy className="w-4 h-4 text-accent inline" /> : (
                            <span className="font-bold text-muted-foreground">{idx + 1}</span>
                          )}
                        </td>
                        <td className="p-3 font-semibold">{team.name}</td>
                        <td className="text-center p-3 text-muted-foreground">{gp}</td>
                        <td className="text-center p-3 font-medium text-primary">{ts.wins}</td>
                        <td className="text-center p-3 text-muted-foreground">{ts.draws}</td>
                        <td className="text-center p-3 text-muted-foreground">{ts.losses}</td>
                        <td className="text-center p-3 text-muted-foreground">{ts.goals_for}</td>
                        <td className="text-center p-3 text-muted-foreground">{ts.goals_against}</td>
                        <td className="text-center p-3">
                          <span className={gd > 0 ? "text-primary font-medium" : gd < 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {gd > 0 ? `+${gd}` : gd}
                          </span>
                        </td>
                        <td className="text-center p-3 pr-5">
                          <Badge className="bg-primary/10 text-primary font-bold">{ts.points}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sorted.length === 0 && <p className="p-8 text-center text-muted-foreground">No teams yet.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}