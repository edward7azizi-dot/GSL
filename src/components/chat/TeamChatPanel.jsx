import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatMessage } from "@/lib/entities";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import MessageBubble from "./MessageBubble";

export default function TeamChatPanel({ team }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat", team.id],
    queryFn: () => ChatMessage.filter({ team_id: team.id }, "-created_date", 100),
    refetchInterval: 5000,
  });

  const sorted = [...messages].reverse();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sorted.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await ChatMessage.create({
      team_id: team.id,
      sender_name: user.full_name || "Player",
      sender_email: user.email,
      content: text.trim(),
    });
    setText("");
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["chat", team.id] });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b shrink-0">
        <h2 className="font-bold">{team.label}</h2>
        <p className="text-xs text-muted-foreground">Team group chat</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sorted.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        )}
        {sorted.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_email === user?.email} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t shrink-0">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !text.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}