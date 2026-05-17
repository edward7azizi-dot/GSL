import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Team } from "@/lib/entities";
import { useAuth } from "@/lib/AuthContext";
import { MessageCircle, Megaphone, Users } from "lucide-react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import TeamChatPanel from "@/components/chat/TeamChatPanel";
import AnnouncementsPanel from "@/components/chat/AnnouncementsPanel";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { cn } from "@/lib/utils";

export default function TeamChat() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedChat, setSelectedChat] = useState({ type: "announcements", id: "announcements", label: "League Announcements" });
  const { unreadAnnouncements, unreadTeamChat } = useUnreadMessages();

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => Team.list(),
  });

  const myTeamTab = (() => {
    if (isAdmin || !user?.team_id) return null;
    const match = teams.find(t => t.id === user.team_id);
    return {
      type: "team",
      id: user.team_id,
      label: match?.name || user.team_name || "Team Chat",
      icon: Users,
      unread: unreadTeamChat,
    };
  })();

  const mobileTabs = [
    { type: "announcements", id: "announcements", label: "Announcements", icon: Megaphone, unread: unreadAnnouncements },
    ...(isAdmin
      ? teams.map(t => ({ type: "team", id: t.id, label: t.name, icon: Users, unread: 0 }))
      : myTeamTab ? [myTeamTab] : []),
  ];

  const renderPanel = () => {
    if (!selectedChat) return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
        <MessageCircle className="w-12 h-12 opacity-20" />
        <p className="text-sm">Select a chat to start messaging.</p>
      </div>
    );
    if (selectedChat.type === "announcements") return <AnnouncementsPanel teams={teams} />;
    if (selectedChat.type === "team") return <TeamChatPanel team={selectedChat} />;
    return null;
  };

  return (
    <div className="space-y-0 -mt-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground text-sm">Team chats and league announcements</p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <div className="hidden md:flex w-64 border-r flex-col bg-card shrink-0">
            <ChatSidebar
              teams={teams}
              userTeamId={user?.team_id}
              userTeamName={user?.team_name}
              selectedChat={selectedChat}
              onSelectChat={setSelectedChat}
              isAdmin={isAdmin}
            />
          </div>

          {/* Main Panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile tabs */}
            <div className="md:hidden sticky top-0 z-20 bg-card flex items-center gap-2 p-2 border-b shrink-0 overflow-x-auto">
              {mobileTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = selectedChat?.id === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedChat({ type: tab.type, id: tab.id, label: tab.label })}
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors relative",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[140px]">{tab.label}</span>
                    {tab.unread > 0 && !isActive && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold">
                        {tab.unread > 99 ? "99+" : tab.unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {renderPanel()}
          </div>
        </div>
      </div>
    </div>
  );
}