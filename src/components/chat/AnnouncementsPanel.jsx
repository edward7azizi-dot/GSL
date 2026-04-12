import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Announcement } from "@/lib/entities";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Megaphone } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TeamMultiSelect from "./TeamMultiSelect";

export default function AnnouncementsPanel({ teams }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const bottomRef = useRef(null);

  const { data: allAnnouncements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => Announcement.list("-created_date", 200),
    refetchInterval: 5000,
  });

  // Filter: show broadcast (empty target) OR targeted to user's team
  const userTeamId = user?.team_id;
  const visible = allAnnouncements.filter(a => {
    if (isAdmin) return true;
    if (!a.target_team_ids || a.target_team_ids.length === 0) return true;
    return userTeamId && a.target_team_ids.includes(userTeamId);
  });

  const sorted = [...visible].reverse();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sorted.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const targetNames = selectedTeamIds.map(id => teams.find(t => t.id === id)?.name).filter(Boolean);
    await Announcement.create({
      content: text.trim(),
      sender_name: user.full_name || "Admin",
      sender_email: user.email,
      target_team_ids: selectedTeamIds,
      target_team_names: targetNames,
    });
    setText("");
    setSelectedTeamIds([]);
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-accent-foreground" />
          <h2 className="font-bold">League Announcements</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isAdmin ? "Post announcements to all players or specific teams" : "Official league announcements"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sorted.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Megaphone className="w-10 h-10 opacity-20" />
            <p className="text-sm">No announcements yet.</p>
          </div>
        )}
        {sorted.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_email === user?.email} isAnnouncement />
        ))}
        <div ref={bottomRef} />
      </div>

      {isAdmin && (
        <div className="p-4 border-t shrink-0 space-y-2">
          <TeamMultiSelect teams={teams} selected={selectedTeamIds} onChange={setSelectedTeamIds} />
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Textarea
              placeholder={selectedTeamIds.length === 0 ? "Broadcast to all teams..." : `Send to ${selectedTeamIds.length} team(s)...`}
              value={text}
              onChange={e => setText(e.target.value)}
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <Button type="submit" disabled={sending || !text.trim()} size="icon" className="self-end h-10 w-10">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}