import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, MapPin, Heart } from "lucide-react";

const FOUNDERS = [
  { name: "Hirad Fazeli", title: "Founder & Commissioner" },
  { name: "Samuel Sanglakhi", title: "Co-Founder & Director of Operations" }
];

const VALUES = [
{ icon: Trophy, title: "Competitive Spirit", desc: "We believe in fair play, healthy competition, and pushing every player to reach their peak performance." },
{ icon: Users, title: "Community First", desc: "GSL is more than a league — it's a family. We bring together players from all walks of life across the GTA." },
{ icon: MapPin, title: "Rooted in Toronto", desc: "Born and raised in the GTA, our league celebrates the diversity and passion of Toronto's soccer culture." },
{ icon: Heart, title: "Passion for the Game", desc: "Every match, every goal, every moment is driven by a deep love for the beautiful game of soccer." }];



export default function AboutUs() {
  return (
    <div className="space-y-12 text-center">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/hero-1.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }} />
        
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 p-10 md:p-16 text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-5">
            <img src="/images/gsl-logo.jpg" alt="GSL Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">About The GSL</h1>
          <p className="text-white/70 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">Founded with a vision to unite soccer lovers across the Greater Toronto Area

          </p>
        </div>
      </div>

      {/* Our Story */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Our Story</h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed text-center">
          <p>
            GTA Super League was born out of a simple idea — that Toronto deserves a recreational soccer league that takes the game seriously, without losing sight of the fun. What started as a small group of friends who wanted more than a casual kickaround has evolved into a full-fledged organization with multiple teams, a professional schedule, and a growing community of passionate players.
          </p>
          

          
          <p>
            Today, GSL continues to grow — not just in numbers, but in spirit. We're proud of what we've built together and even more excited about where we're headed.
          </p>
        </div>
      </div>

      {/* Our Values */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Our Values</h2>
        <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
          {VALUES.map((v) =>
          <Card key={v.title} className="p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <v.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1.5">{v.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Meet the Founders */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Meet the Founders</h2>
        <p className="text-muted-foreground text-sm mb-6">The people behind the league.</p>
        <Card className="overflow-hidden max-w-2xl mx-auto">
          <div className="aspect-[16/9] overflow-hidden">
            <img src="/images/IMG_6688.jpg" alt="Hirad Fazeli and Samuel Sanglakhi" className="w-full h-full object-cover" />
          </div>
          <CardContent className="p-6 text-center">
            <div className="flex justify-center gap-10 mb-4">
              {FOUNDERS.map((f) => (
                <div key={f.name}>
                  <h3 className="font-bold text-lg">{f.name}</h3>
                  <p className="text-sm text-primary font-medium mt-0.5">{f.title}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Hirad and Samuel co-founded the GTA Super League with a shared mission to build a competitive yet welcoming soccer community across the Greater Toronto Area. Their combined passion for the beautiful game and dedication to the players is what keeps GSL growing season after season.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>);

}