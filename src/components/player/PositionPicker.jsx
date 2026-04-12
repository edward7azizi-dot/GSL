import React from "react";
import { cn } from "@/lib/utils";

const POSITIONS = {
  GK: ["GK"],
  Defender: ["CB", "RB", "LB", "RWB", "LWB"],
  Midfielder: ["CDM", "CM", "CAM"],
  Attacker: ["CF", "RW", "LW", "ST"],
};

const MAIN_COLORS = {
  GK: "bg-yellow-500/20 border-yellow-500 text-yellow-700",
  Defender: "bg-blue-500/20 border-blue-500 text-blue-700",
  Midfielder: "bg-green-500/20 border-green-500 text-green-700",
  Attacker: "bg-red-500/20 border-red-500 text-red-700",
};

export default function PositionPicker({ mainPosition, subPosition, onChange }) {
  const handleMainClick = (pos) => {
    const subs = POSITIONS[pos];
    onChange({ mainPosition: pos, subPosition: subs.length === 1 ? subs[0] : "" });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {Object.keys(POSITIONS).map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => handleMainClick(pos)}
            className={cn(
              "py-2.5 rounded-lg border-2 text-sm font-bold transition-all",
              mainPosition === pos
                ? MAIN_COLORS[pos]
                : "bg-muted/40 border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            {pos}
          </button>
        ))}
      </div>

      {mainPosition && POSITIONS[mainPosition]?.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {POSITIONS[mainPosition].map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => onChange({ mainPosition, subPosition: sub })}
              className={cn(
                "py-2 rounded-lg border-2 text-xs font-semibold transition-all",
                subPosition === sub
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-muted/40 border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onChange({ mainPosition: "Wildcard", subPosition: "Wildcard" })}
        className={cn(
          "w-full py-2.5 rounded-lg border-2 text-sm font-bold transition-all",
          mainPosition === "Wildcard"
            ? "bg-purple-500/20 border-purple-500 text-purple-700 shadow-[0_0_8px_2px_rgba(168,85,247,0.5)]"
            : "bg-muted/40 border-purple-400/70 text-muted-foreground shadow-[0_0_8px_2px_rgba(168,85,247,0.35)] hover:bg-purple-500/20 hover:border-purple-500 hover:text-purple-700 hover:shadow-[0_0_10px_3px_rgba(168,85,247,0.55)]"
        )}
      >
        Wildcard
      </button>
    </div>
  );
}