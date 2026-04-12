import React from "react";
import { Menu, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function TopBar({ onMenuClick }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-6 gap-4">
      <div className="lg:hidden w-9 h-9 rounded-lg overflow-hidden shrink-0">
        <img src="/images/gsl-logo.jpg" alt="GSL Logo" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1" />
      <Button variant="ghost" size="icon" className="lg:hidden w-11 h-11" onClick={onMenuClick}>
        <Menu className="w-9 h-9" />
      </Button>
      {!isAuthenticated && (
        <Button
          size="sm"
          className="gap-2"
          onClick={() => navigate('/Login')}
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </Button>
      )}
    </header>
  );
}
