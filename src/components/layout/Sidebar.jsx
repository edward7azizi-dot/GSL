import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Player } from "@/lib/entities";
import EditProfileDialog from "@/components/player/EditProfileDialog";
import {
  Home, Users, Calendar, Trophy, BarChart3, MessageCircle,
  Settings, Image, Info, X, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const publicLinks = [
  { label: "Home", path: "/Home", icon: Home },
  { label: "Teams", path: "/Teams", icon: Users },
  { label: "Schedule", path: "/Schedule", icon: Calendar },
  { label: "Standings", path: "/Standings", icon: Trophy },
  { label: "Player Stats", path: "/PlayerStats", icon: BarChart3 },
  { label: "Media", path: "/Media", icon: Image },
  { label: "About Us", path: "/AboutUs", icon: Info },
];

const playerLinks = [
  { label: "Team Chat", path: "/TeamChat", icon: MessageCircle },
];

const adminLinks = [
  { label: "Admin Panel", path: "/Admin", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role;
  const [editOpen, setEditOpen] = useState(false);
  const [playerRecord, setPlayerRecord] = useState(null);

  useEffect(() => {
    if (!user || role === "admin") return;
    Player.filter({ user_email: user.email }).then(players => {
      if (players[0]) setPlayerRecord(players[0]);
    });
  }, [user]);

  const NavLink = ({ item }) => {
    const active = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
          active
            ? "bg-red-600/20 text-red-500"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <item.icon className="w-4 h-4" />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 flex items-center justify-between border-b border-sidebar-border">
          <Link to="/Home" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/images/gsl-logo.jpg" alt="GSL Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">GSL</h1>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">GTA Super League</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden text-sidebar-foreground" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">League</p>
          {publicLinks.map(item => <NavLink key={item.path} item={item} />)}

          {(user?.team_id || role === "admin") && (
            <>
              <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">Player</p>
              {playerLinks.map(item => <NavLink key={item.path} item={item} />)}
            </>
          )}

          {role === "admin" && (
            <>
              <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">Admin</p>
              {adminLinks.map(item => <NavLink key={item.path} item={item} />)}
            </>
          )}
        </nav>

        {user && (
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={() => role !== "admin" && setEditOpen(true)}
              className={`flex items-center gap-3 w-full text-left ${role !== "admin" ? "hover:opacity-80 transition-opacity cursor-pointer" : "cursor-default"}`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{playerRecord?.full_name || user.full_name || "User"}</p>
                <p className="text-[10px] text-sidebar-foreground/50 capitalize">
                  {role !== "admin" && playerRecord?.sub_position ? playerRecord.sub_position : (role || "visitor")}
                </p>
              </div>
            </button>
            {role !== "admin" && (
              <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} player={playerRecord} />
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 mt-2 w-full text-left text-xs text-sidebar-foreground/50 hover:text-destructive transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}