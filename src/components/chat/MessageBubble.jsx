import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function MessageBubble({ msg, isMe, isAnnouncement }) {
  return (
    <div className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}>
      {!isMe && (
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 text-xs font-bold text-primary uppercase">
          {(msg.sender_name || "?")[0]}
        </div>
      )}
      <div className={cn("max-w-[75%] space-y-1", isMe && "items-end flex flex-col")}>
        {!isMe && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground/70">{msg.sender_name || "Unknown"}</span>
            {isAnnouncement && msg.target_team_names?.length > 0 && (
              <Badge variant="secondary" className="text-[10px] py-0 h-4">
                {msg.target_team_names.join(", ")}
              </Badge>
            )}
          </div>
        )}
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isMe
            ? "bg-primary text-primary-foreground rounded-br-md"
            : isAnnouncement
              ? "bg-accent/20 text-foreground border border-accent/30 rounded-bl-md"
              : "bg-muted rounded-bl-md"
        )}>
          {msg.content}
        </div>
        <p className="text-[10px] text-muted-foreground px-1">
          {msg.created_date && format(new Date(msg.created_date), "MMM d, h:mm a")}
        </p>
      </div>
    </div>
  );
}