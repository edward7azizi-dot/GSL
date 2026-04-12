import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Team, Player } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function Teams() {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => Team.list(),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => Player.list(),
  });

  const getPlayerCount = (teamId) => players.filter(p => p.team_id === teamId).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground text-sm">{teams.length} teams competing this season</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {teams.map(team => (
            <Card key={team.id} className="overflow-hidden hover:shadow-lg transition-shadow group bg-white text-gray-900">
              <div className="h-1.5 bg-primary" />
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                {/* Logo */}
                <div className="w-28 h-28 flex items-center justify-center mt-2 overflow-hidden">
                  {team.logo_url ? (
                    <img
                      src={team.logo_url}
                      alt={team.name}
                      className={`object-contain ${['Sheppard United', 'FC George Richardson'].includes(team.name) ? 'w-36 h-36' : 'w-full h-full'}`}
                    />
                  ) : (
                    <Shield className="w-10 h-10 text-primary" />
                  )}
                </div>

                {/* Team name — fixed height so buttons align */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[4.5rem]">
                  <h3 className="font-bold text-base leading-tight">{team.name}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{getPlayerCount(team.id)} players</span>
                  </div>
                </div>

                {/* Roster button */}
                <Link to={`/TeamRoster/${team.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-white border-0">
                    View Roster
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}