import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Game, Location } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import ScheduleMap from "@/components/schedule/ScheduleMap";

const statusStyle = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  postponed: "bg-red-50 text-red-700 border-red-200",
};

export default function Schedule() {
  const [filter, setFilter] = useState("all");

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: () => Game.list("date", 200),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => Location.list(),
  });

  const filtered = filter === "all" ? games : games.filter(g => g.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground text-sm">All games for the current season</p>
      </div>

      {/* Map */}
      <ScheduleMap games={games} locations={locations} />

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="postponed">Postponed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Game list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No games found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {sorted.map(game => (
            <Card key={game.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    {/* Teams & Score */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{game.home_team_name || "TBD"}</span>
                      {game.status === "completed" ? (
                        <span className="text-lg font-black text-primary px-1">
                          {game.home_score ?? 0} – {game.away_score ?? 0}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-medium px-1">vs</span>
                      )}
                      <span className="font-bold">{game.away_team_name || "TBD"}</span>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      {game.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(game.date), "EEE, MMM d, yyyy")}
                        </span>
                      )}
                      {game.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{game.time}
                        </span>
                      )}
                      {game.location_name && (() => {
                        const loc = locations.find(l => l.id === game.location_id);
                        const mapsUrl = loc?.map_url ||
                          (loc?.lat && loc?.lng ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : null) ||
                          (loc?.address ? `https://maps.google.com/?q=${encodeURIComponent(loc.address)}` : null) ||
                          (game.location_name ? `https://maps.google.com/?q=${encodeURIComponent(game.location_name)}` : null);
                        return (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline font-medium"
                            title="Open in Maps"
                          >
                            <MapPin className="w-3 h-3" />
                            {game.location_name}
                            {game.location_address && <span className="text-muted-foreground/60 font-normal">· {game.location_address}</span>}
                          </a>
                        );
                      })()}
                    </div>
                  </div>

                  <Badge variant="outline" className={`shrink-0 capitalize ${statusStyle[game.status] || ""}`}>
                    {game.status === "scheduled" ? "Upcoming" : game.status?.replace("_", " ") || "Upcoming"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}