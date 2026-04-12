import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Media as MediaEntity } from "@/lib/entities";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Photos", "Videos"];

function MediaCard({ item, onClick }) {
  const isVideo = item.type === "video";
  const thumb = item.thumbnail_url || item.url;

  return (
    <div
      onClick={() => onClick(item)}
      className="group relative rounded-xl overflow-hidden cursor-pointer bg-muted aspect-video"
    >
      <img
        src={thumb}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-sm font-semibold truncate">{item.title}</p>
        {item.game_week && <p className="text-white/60 text-xs">Week {item.game_week}</p>}
      </div>
    </div>
  );
}

function LightboxModal({ item, onClose }) {
  if (!item) return null;
  const isVideo = item.type === "video";

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {isVideo ? (
          <div className="aspect-video w-full">
            <iframe
              src={item.url}
              className="w-full h-full"
              allowFullScreen
              title={item.title}
            />
          </div>
        ) : (
          <img src={item.url} alt={item.title} className="w-full max-h-[80vh] object-contain" />
        )}
        <div className="p-4 bg-card">
          <p className="font-bold text-base">{item.title}</p>
          {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Media() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: () => MediaEntity.list("-created_date", 50),
  });

  const filtered = media.filter(m => {
    if (filter === "Photos") return m.type === "photo";
    if (filter === "Videos") return m.type === "video";
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Media</h1>
        <p className="text-muted-foreground text-sm">Photos & videos from the GTA Super League</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {FILTERS.map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="gap-2"
          >
            {f === "Photos" && <ImageIcon className="w-3.5 h-3.5" />}
            {f === "Videos" && <Play className="w-3.5 h-3.5" />}
            {f}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No media uploaded yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <MediaCard key={item.id} item={item} onClick={setSelected} />
          ))}
        </div>
      )}

      <LightboxModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}