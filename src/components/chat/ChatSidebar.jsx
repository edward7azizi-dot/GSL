import React from "react";
import { cn } from "@/lib/utils";
import { Megaphone, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ChatSidebar({ teams, userTeamId, userTeamName, selectedChat, onSelectChat, isAdmin, isMobile, onClose }) {
  let teamChats;
  if (isAdmin) {
    teamChats = teams.map(t => ({ type: "team", id: t.id, label: t.name, icon: Users, description: "Team chat" }));
  } else if (userTeamId) {
    const match = teams.find(t => t.id === userTeamId);
    teamChats = [{
      type: "team",
      id: userTeamId,
      label: match?.name || userTeamName || "Team Chat",
      icon: Users,
      description: "Team chat",
    }];
  } else {
    teamChats = [];
  }

  const items = [
    { type: "announcements", id: "announcements", label: "League Announcements", icon: Megaphone, description: "Admin broadcasts" },
    ...teamChats,
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Chats</h2>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {items.map(item => {
          const Icon = item.icon;
          const isSelected = selectedChat?.id === item.id;
          const isLocked = item.locked;
          return (
            <button
              key={item.id}
              disabled={isLocked}
              onClick={() => { onSelectChat(item); if (onClose) onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                isSelected ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-muted/60",
                isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                item.type === "announcements" ? "bg-accent/20" : "bg-primary/10",
                isSelected && "bg-primary/20"
              )}>
                <Icon className={cn("w-4 h-4", item.type === "announcements" ? "text-accent-foreground" : "text-primary")} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold truncate", isSelected && "text-primary")}>{item.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {isLocked ? "🔒 Join team to access" : item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}