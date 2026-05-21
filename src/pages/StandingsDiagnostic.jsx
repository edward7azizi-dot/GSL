import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Team, Game } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, AlertTriangle, CheckCircle2 } from "lucide-react";

// Derive W/D/L/GF/GA/PTS for every team by walking completed games.
// 3 pts win, 1 pt draw, 0 pts loss.
function computeDerived(teams, completedGames) {
  const base = {};
  for (const t of teams) {
    base[t.id] = {
      id: t.id,
      name: t.name,
      wins: 0, draws: 0, losses: 0,
      goals_for: 0, goals_against: 0,
      points: 0,
      games: [],
    };
  }
  for (const g of completedGames) {
    const home = base[g.home_team_id];
    const away = base[g.away_team_id];
    if (!home || !away) continue;
    const hs = g.home_score ?? 0;
    const as = g.away_score ?? 0;

    home.goals_for += hs; home.goals_against += as;
    away.goals_for += as; away.goals_against += hs;

    if (hs > as) { home.wins++; home.points += 3; away.losses++; }
    else if (as > hs) { away.wins++; away.points += 3; home.losses++; }
    else { home.draws++; away.draws++; home.points++; away.points++; }

    home.games.push({ ...g, _opp: away.name, _for: hs, _against: as, _side: "H" });
    away.games.push({ ...g, _opp: home.name, _for: as, _against: hs, _side: "A" });
  }
  return base;
}

function DiffCell({ cached, derived }) {
  const same = cached === derived;
  return (
    <td className="text-center p-2">
      <span className={same ? "text-muted-foreground" : "text-destructive font-bold"}>
        {cached}
        {!same && <span className="ml-1 text-xs">→ {derived}</span>}
      </span>
    </td>
  );
}

export default function StandingsDiagnostic() {
  const [expanded, setExpanded] = useState(null);

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => Team.list(),
  });
  const { data: allGames = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["games"],
    queryFn: () => Game.list(),
  });

  const completedGames = useMemo(
    () => allGames.filter(g => g.status === "completed"),
    [allGames]
  );

  // Surface anomalies: non-completed games that have a non-zero score, and possible duplicates.
  const scoredButNotCompleted = allGames.filter(
    g => g.status !== "completed" && ((g.home_score ?? 0) !== 0 || (g.away_score ?? 0) !== 0)
  );
  const duplicates = useMemo(() => {
    const seen = new Map();
    const dups = [];
    for (const g of completedGames) {
      const key = [g.home_team_id, g.away_team_id, g.date].join("|");
      if (seen.has(key)) dups.push([seen.get(key), g]);
      else seen.set(key, g);
    }
    return dups;
  }, [completedGames]);

  const derived = useMemo(
    () => computeDerived(teams, completedGames),
    [teams, completedGames]
  );

  if (teamsLoading || gamesLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const rows = teams
    .map(t => ({
      team: t,
      cached: {
        wins: t.wins || 0, draws: t.draws || 0, losses: t.losses || 0,
        goals_for: t.goals_for || 0, goals_against: t.goals_against || 0,
        points: t.points || 0,
      },
      derived: derived[t.id],
    }))
    .sort((a, b) => (b.derived?.points || 0) - (a.derived?.points || 0));

  const mismatched = rows.filter(r => {
    const d = r.derived; const c = r.cached;
    if (!d) return false;
    return d.wins !== c.wins || d.draws !== c.draws || d.losses !== c.losses
      || d.goals_for !== c.goals_for || d.goals_against !== c.goals_against
      || d.points !== c.points;
  });

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Standings Diagnostic</h1>
        <p className="text-muted-foreground text-sm">
          Compares the cached team counters (what /Standings displays today) against values derived live from the games table.
          Rows in red are out of sync.
        </p>
      </div>

      {/* Summary banner */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          {mismatched.length === 0 ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm">All team counters match the derived totals.</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-sm">
                <span className="font-bold">{mismatched.length}</span> team(s) have stale cached counters.
              </span>
            </>
          )}
        </CardContent>
      </Card>

      {/* Anomalies */}
      {(scoredButNotCompleted.length > 0 || duplicates.length > 0) && (
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="font-semibold">Anomalies in games table</p>
            {scoredButNotCompleted.length > 0 && (
              <div>
                <p className="text-destructive font-medium">
                  {scoredButNotCompleted.length} game(s) have a non-zero score but status ≠ "completed" — excluded from derived totals:
                </p>
                <ul className="text-xs text-muted-foreground ml-4 list-disc">
                  {scoredButNotCompleted.map(g => (
                    <li key={g.id}>
                      {g.home_team_name} {g.home_score}–{g.away_score} {g.away_team_name} ({g.date}, status={g.status})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {duplicates.length > 0 && (
              <div>
                <p className="text-destructive font-medium">
                  {duplicates.length} possible duplicate completed game(s) (same home/away/date):
                </p>
                <ul className="text-xs text-muted-foreground ml-4 list-disc">
                  {duplicates.map(([a, b], i) => (
                    <li key={i}>
                      {a.home_team_name} vs {a.away_team_name} on {a.date} — ids {a.id} & {b.id}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comparison table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs">
                <th className="text-left p-2 pl-4">Team</th>
                <th className="text-center p-2">W</th>
                <th className="text-center p-2">D</th>
                <th className="text-center p-2">L</th>
                <th className="text-center p-2">GF</th>
                <th className="text-center p-2">GA</th>
                <th className="text-center p-2">PTS</th>
                <th className="text-center p-2">GP (derived)</th>
                <th className="text-center p-2 pr-4">Games</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ team, cached, derived: d }) => {
                if (!d) return null;
                const isOpen = expanded === team.id;
                const stale =
                  d.wins !== cached.wins || d.draws !== cached.draws || d.losses !== cached.losses
                  || d.goals_for !== cached.goals_for || d.goals_against !== cached.goals_against
                  || d.points !== cached.points;
                return (
                  <React.Fragment key={team.id}>
                    <tr className={`border-b ${stale ? "bg-destructive/5" : ""}`}>
                      <td className="p-2 pl-4 font-semibold">
                        {team.name}
                        {stale && <Badge variant="destructive" className="ml-2 text-[10px]">stale</Badge>}
                      </td>
                      <DiffCell cached={cached.wins} derived={d.wins} />
                      <DiffCell cached={cached.draws} derived={d.draws} />
                      <DiffCell cached={cached.losses} derived={d.losses} />
                      <DiffCell cached={cached.goals_for} derived={d.goals_for} />
                      <DiffCell cached={cached.goals_against} derived={d.goals_against} />
                      <DiffCell cached={cached.points} derived={d.points} />
                      <td className="text-center p-2 text-muted-foreground">{d.wins + d.draws + d.losses}</td>
                      <td className="text-center p-2 pr-4">
                        <button
                          onClick={() => setExpanded(isOpen ? null : team.id)}
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {d.games.length} <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/20">
                        <td colSpan={9} className="p-3 pl-8">
                          {d.games.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No completed games.</p>
                          ) : (
                            <table className="text-xs w-full">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="text-left pr-3 py-1">Date</th>
                                  <th className="text-left pr-3 py-1">Wk</th>
                                  <th className="text-left pr-3 py-1">H/A</th>
                                  <th className="text-left pr-3 py-1">Opponent</th>
                                  <th className="text-left pr-3 py-1">Score (for–against)</th>
                                  <th className="text-left pr-3 py-1">Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {d.games
                                  .slice()
                                  .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
                                  .map(g => {
                                    const result = g._for > g._against ? "W" : g._for < g._against ? "L" : "D";
                                    return (
                                      <tr key={g.id} className="border-t border-border/40">
                                        <td className="pr-3 py-1">{g.date || "—"}</td>
                                        <td className="pr-3 py-1">{g.week ?? "—"}</td>
                                        <td className="pr-3 py-1">{g._side}</td>
                                        <td className="pr-3 py-1">{g._opp}</td>
                                        <td className="pr-3 py-1 font-mono">{g._for} – {g._against}</td>
                                        <td className={`pr-3 py-1 font-semibold ${result === "W" ? "text-primary" : result === "L" ? "text-destructive" : "text-muted-foreground"}`}>{result}</td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Tip: expand a team to see every completed game pulled from the <code>games</code> table. Cross-reference those rows against /Schedule. If the derived column matches your schedule but the cached column doesn't, the bug is exactly what we suspected — and switching /Standings to derived values will fix it.
      </p>
    </div>
  );
}
