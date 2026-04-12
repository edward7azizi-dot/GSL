import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Team, Player } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Shirt } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const positionColors = {
  GK: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Defender: "bg-blue-100 text-blue-800 border-blue-200",
  Midfielder: "bg-green-100 text-green-800 border-green-200",
  Attacker: "bg-red-100 text-red-800 border-red-200",
};

export default function TeamRoster() {
  const { teamId } = useParams();

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => Team.list(),
  });

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players", teamId],
    queryFn: () => Player.filter({ team_id: teamId }),
    enabled: !!teamId,
  });

  const team = teams.find(t => t.id === teamId);

  const sorted = [...players].sort((a, b) => (a.jersey_number || 99) - (b.jersey_number || 99));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/Teams">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{team?.name || "Team Roster"}</h1>
            <p className="text-muted-foreground text-sm">{players.length} player{players.length !== 1 ? "s" : ""} registered</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Shirt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">No players registered yet</p>
            <p className="text-sm text-muted-foreground mt-1">Players will appear here once they join the team.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(player => (
            <Card key={player.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-black text-primary">
                    {player.jersey_number || "–"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{player.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{team?.name}</p>
                  <div className="mt-1.5">
                    <Badge
                      variant="outline"
                      className={`text-xs ${positionColors[player.main_position] || "bg-muted text-muted-foreground"}`}
                    >
                      {player.sub_position || player.main_position || "No position"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}