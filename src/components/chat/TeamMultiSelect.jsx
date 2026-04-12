import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TeamMultiSelect({ teams, selected, onChange }) {
  const [open, setOpen] = useState(false);

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const selectedTeams = teams.filter(t => selected.includes(t.id));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm hover:bg-muted/50 transition-colors"
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="flex-1 text-left truncate text-muted-foreground">
          {selected.length === 0 ? "Broadcast to ALL teams" : `${selected.length} team(s) selected`}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* Selected team badges */}
      {selectedTeams.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selectedTeams.map(t => (
            <Badge key={t.id} variant="secondary" className="gap-1 text-xs pr-1">
              {t.name}
              <button type="button" onClick={() => toggle(t.id)} className="ml-0.5 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute bottom-full mb-1 left-0 right-0 z-50 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div className="p-1">
            <button
              type="button"
              onClick={() => { onChange([]); setOpen(false); }}
              className={cn("w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted", selected.length === 0 && "bg-primary/10 text-primary font-medium")}
            >
              🌐 Broadcast to all
            </button>
            {teams.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={cn("w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex items-center gap-2", selected.includes(t.id) && "bg-primary/10 text-primary font-medium")}
              >
                <span className={cn("w-2 h-2 rounded-full border", selected.includes(t.id) ? "bg-primary border-primary" : "border-muted-foreground")} />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}