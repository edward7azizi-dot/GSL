import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Announcement, ChatMessage } from "@/lib/entities";

const lsKey = (email, channel) => `gsl:lastSeen:${email}:${channel}`;
const LAST_SEEN_EVENT = "gsl:lastSeenChanged";

export function getLastSeen(email, channel) {
  if (!email) return 0;
  try {
    const v = localStorage.getItem(lsKey(email, channel));
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

export function markChannelRead(email, channel, ts = Date.now()) {
  if (!email) return;
  try {
    localStorage.setItem(lsKey(email, channel), String(ts));
    window.dispatchEvent(new CustomEvent(LAST_SEEN_EVENT));
  } catch {
    // ignore
  }
}

export function useUnreadMessages() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const userTeamId = user?.team_id;
  const enabled = !!user;

  const [, forceTick] = useState(0);
  useEffect(() => {
    const handler = () => forceTick(t => t + 1);
    window.addEventListener(LAST_SEEN_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(LAST_SEEN_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const { data: announcements = [] } = useQuery({
    queryKey: ["unread:announcements"],
    queryFn: () => Announcement.list("-created_date", 50),
    enabled,
    refetchInterval: 30000,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ["unread:chat", userTeamId],
    queryFn: () => ChatMessage.filter({ team_id: userTeamId }, "-created_date", 50),
    enabled: enabled && !!userTeamId,
    refetchInterval: 30000,
  });

  const annSeen = getLastSeen(user?.email, "announcements");
  const teamSeen = userTeamId ? getLastSeen(user?.email, `team:${userTeamId}`) : 0;

  const visibleAnn = announcements.filter(a => {
    if (a.sender_email === user?.email) return false;
    if (isAdmin) return true;
    if (!a.target_team_ids || a.target_team_ids.length === 0) return true;
    return userTeamId && a.target_team_ids.includes(userTeamId);
  });

  const unreadAnnouncements = visibleAnn.filter(a => {
    const t = a.created_date ? new Date(a.created_date).getTime() : 0;
    return t > annSeen;
  }).length;

  const unreadTeamChat = userTeamId
    ? chatMessages.filter(m => {
        if (m.sender_email === user?.email) return false;
        const t = m.created_date ? new Date(m.created_date).getTime() : 0;
        return t > teamSeen;
      }).length
    : 0;

  return {
    unreadAnnouncements,
    unreadTeamChat,
    total: unreadAnnouncements + unreadTeamChat,
  };
}
