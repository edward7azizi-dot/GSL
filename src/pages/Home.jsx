import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Team, Game, Player, Media } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, Users, ArrowRight, MapPin, Play, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import JoinTeamCard from "@/components/JoinTeamCard";

const SLIDES = [
  "/images/hero-1.jpg",
  "/images/hero-2.jpg",
  "/images/hero-3.jpg",
  "/images/hero-4.jpg",
  "/images/hero-5.jpg",
];

function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-primary-foreground">
      {SLIDES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url('${src}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10">
        <Badge className="bg-accent text-accent-foreground mb-4 font-semibold">Season 2026</Badge>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">GTA Super League</h1>
        <p className="text-primary-foreground/80 text-lg max-w-md">Toronto's fastest-growing recreational soccer league. Game on.</p>
        <div className="flex gap-3 mt-6 justify-center md:justify-start">
          <Link to="/Schedule">
            <Button variant="secondary" className="gap-2 font-semibold">
              <Calendar className="w-4 h-4" /> View Schedule
            </Button>
          </Link>
          <Link to="/Standings">
            <Button variant="outline" className="gap-2 font-semibold bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Trophy className="w-4 h-4" /> Standings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedMedia() {
  const { data: media = [], isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: () => Media.list("-created_date", 6),
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array(3).fill(0).map((_, i) => <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse" />)}
    </div>
  );

  if (media.length === 0) return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
      No media yet — check back soon!
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {media.map(item => (
        <Link to="/Media" key={item.id} className="group relative rounded-xl overflow-hidden aspect-video bg-muted block">
          <img src={item.thumbnail_url || item.url} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
          {item.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => Team.list(),
  });
  const { data: games = [] } = useQuery({
    queryKey: ["games"],
    queryFn: () => Game.list("-date", 50),
  });
  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => Player.list(),
  });

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

  const upcomingGames = games
    .filter((g) => ["scheduled", "in_progress"].includes(getEffectiveStatus(g)))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const recentResults = games
    .filter((g) => g.status === "completed")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <HeroSlideshow />

      {user && user.role !== "admin" && <JoinTeamCard />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Teams" value={teams.length} color="bg-primary" />
        <StatCard icon={Users} label="Players" value={players.length} color="bg-blue-500" />
        <StatCard icon={Calendar} label="Games" value={games.length} color="bg-accent" />
        <StatCard icon={Trophy} label="Completed" value={games.filter((g) => g.status === "completed").length} color="bg-purple-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Upcoming Games</h2>
              <Link to="/Schedule" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {upcomingGames.length === 0 && <p className="text-muted-foreground text-sm">No upcoming games.</p>}
            <div className="space-y-3">
              {upcomingGames.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-semibold text-sm">{g.home_team_name} vs {g.away_team_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      {g.date && format(new Date(g.date), "MMM d")}
                      {g.time && <span>· {g.time}</span>}
                      {g.location_name && <><MapPin className="w-3 h-3 ml-1" />{g.location_name}</>}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">Week {g.week || "–"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Results</h2>
              <Link to="/Schedule" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentResults.length === 0 && <p className="text-muted-foreground text-sm">No results yet.</p>}
            <div className="space-y-3">
              {recentResults.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-semibold text-sm">
                      {g.home_team_name} <span className="text-primary font-bold">{g.home_score}</span>
                      {" – "}
                      <span className="text-primary font-bold">{g.away_score}</span> {g.away_team_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {g.date && format(new Date(g.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary text-xs">Final</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Media */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Featured Media</h2>
          <Link to="/Media" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <FeaturedMedia />
      </div>
    </div>
  );
}