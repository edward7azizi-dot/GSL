import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Location } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink } from "lucide-react";

export default function Locations() {
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: () => Location.list(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
        <p className="text-muted-foreground text-sm">Fields and venues for league games</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : locations.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No locations added yet.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {locations.map(loc => (
            <Card key={loc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{loc.name}</h3>
                    {loc.address && <p className="text-sm text-muted-foreground mt-1">{loc.address}</p>}
                    {loc.map_url && (
                      <a href={loc.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                        <ExternalLink className="w-3 h-3" /> View on Map
                      </a>
                    )}
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