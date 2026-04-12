import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Team } from "@/lib/entities";
import { useAuth } from "@/lib/AuthContext";
import { MessageCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatSidebar from "@/components/chat/ChatSidebar";
import TeamChatPanel from "@/components/chat/TeamChatPanel";
import AnnouncementsPanel from "@/components/chat/AnnouncementsPanel";
import { cn } from "@/lib/utils";

export default function TeamChat() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedChat, setSelectedChat] = useState({ type: "announcements", id: "announcements", label: "League Announcements" });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => Team.list(),
  });

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
              selectedChat={selectedChat}
              onSelectChat={setSelectedChat}
              isAdmin={isAdmin}
            />
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="w-72 bg-card border-r flex flex-col shadow-xl">
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="font-bold">Chats</span>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" /></Button>
                </div>
                <ChatSidebar
                  teams={teams}
                  userTeamId={user?.team_id}
                  selectedChat={selectedChat}
                  onSelectChat={setSelectedChat}
                  isAdmin={isAdmin}
                  onClose={() => setSidebarOpen(false)}
                />
              </div>
              <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
            </div>
          )}

          {/* Main Panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile header */}
            <div className="md:hidden flex items-center gap-3 p-3 border-b shrink-0">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <span className="font-semibold text-sm truncate">{selectedChat?.label || "Select a chat"}</span>
            </div>
            {renderPanel()}
          </div>
        </div>
      </div>
    </div>
  );
}