import { Trophy, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO, isToday } from "date-fns";
import { PLAYOFF_BRACKET, TEAM_LOGOS, BYES } from "@/config/playoffs";

const dayLabel = (date) => {
  const d = parseISO(date);
  return isToday(d) ? "Tonight" : format(d, "MMM d");
};

function Fixture({ match, center }) {
  const when = match.date ? (match.time ? `${dayLabel(match.date)} · ${match.time}` : dayLabel(match.date)) : "TBD";
  const upcoming = match.date && isToday(parseISO(match.date)) && !match.winner;
  return (
    <div className={`mt-2 space-y-1 ${center ? "text-center" : ""}`}>
      <p className={`text-[11px] font-semibold ${upcoming ? "text-primary" : "text-muted-foreground"}`}>{when}</p>
      {match.venue && (
        <p className={`text-[11px] text-muted-foreground/70 flex items-center gap-1 ${center ? "justify-center" : ""}`}>
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{match.venue}</span>
        </p>
      )}
    </div>
  );
}

function TeamRow({ name, isWinner, decided, compact }) {
  const lost = decided && !isWinner;
  return (
    <div className={`flex items-center gap-2.5 ${compact ? "px-3 py-2" : "px-3.5 py-2.5"} ${lost ? "opacity-40" : ""}`}>
      <div
        className={`${compact ? "w-7 h-7" : "w-9 h-9"} rounded-md overflow-hidden shrink-0 ${
          name ? "bg-muted" : "border border-dashed border-border"
        }`}
      >
        {TEAM_LOGOS[name] && <img src={TEAM_LOGOS[name]} alt="" className="w-full h-full object-cover" />}
      </div>
      <span
        className={`${compact ? "text-xs" : "text-sm"} truncate ${
          isWinner ? "font-bold text-amber-400" : name ? "font-medium" : "text-muted-foreground"
        }`}
      >
        {name || "TBD"}
      </span>
      {BYES.includes(name) && (
        <span className="ml-auto text-[9px] font-bold tracking-wider text-muted-foreground shrink-0">BYE</span>
      )}
      {isWinner && <Trophy className="ml-auto w-3.5 h-3.5 text-amber-400 shrink-0" />}
    </div>
  );
}

function Matchup({ round, match, compact }) {
  const decided = Boolean(match.winner);
  return (
    <div className="w-full">
      {round && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{round}</p>
      )}
      <div className={`rounded-xl border divide-y overflow-hidden ${decided ? "border-amber-400/40" : "border-border"}`}>
        <TeamRow name={match.home} isWinner={match.winner === match.home} decided={decided} compact={compact} />
        <TeamRow name={match.away} isWinner={match.winner === match.away} decided={decided} compact={compact} />
      </div>
      <Fixture match={match} />
    </div>
  );
}

function FinalCard({ final, finalists, compact }) {
  const decided = Boolean(final.winner);
  return (
    <div className="w-full">
      <div className="flex justify-center mb-2">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${decided ? "bg-amber-400/20" : "bg-muted"}`}>
          <Trophy className={`w-5 h-5 ${decided ? "text-amber-400" : "text-muted-foreground"}`} />
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1.5 text-center">Final</p>
      <div className="rounded-xl border border-amber-400/40 divide-y overflow-hidden">
        {/* Guard on `decided` — before the final is played both sides are null,
            and `null === null` would style two empty TBD rows as the winner. */}
        <TeamRow name={finalists[0]} isWinner={decided && final.winner === finalists[0]} decided={decided} compact={compact} />
        <TeamRow name={finalists[1]} isWinner={decided && final.winner === finalists[1]} decided={decided} compact={compact} />
      </div>
      <Fixture match={final} center />
    </div>
  );
}

function RoundHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export default function PlayoffBracket() {
  const { quarterfinals, semifinals, final } = PLAYOFF_BRACKET;
  // The final fills itself in as the semifinals resolve.
  const finalists = semifinals.map((sf) => sf.winner);

  return (
    <Card className="border-primary/30 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-amber-400 to-primary" />
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold uppercase tracking-[0.2em]">Playoffs</h2>
        </div>

        {/* Mobile-first: one column, grouped by round, most imminent round first.
            Full-width cards so "FC George Richardson" doesn't truncate. */}
        <div className="lg:hidden">
          <RoundHeading>Semifinals</RoundHeading>
          <div className="space-y-4 mb-7">
            {semifinals.map((m, i) => (
              <Matchup key={i} match={m} />
            ))}
          </div>

          <div className="mb-7">
            <FinalCard final={final} finalists={finalists} />
          </div>

          <RoundHeading>Quarterfinals</RoundHeading>
          <div className="space-y-4">
            {quarterfinals.map((m, i) => (
              <Matchup key={i} match={m} compact />
            ))}
          </div>
        </div>

        {/* Desktop: mirrored bracket, quarterfinals on the outside. */}
        <div className="hidden lg:grid grid-cols-5 gap-5 items-center">
          <Matchup round="Quarterfinal" match={quarterfinals[0]} compact />
          <Matchup round="Semifinal" match={semifinals[0]} compact />
          <FinalCard final={final} finalists={finalists} compact />
          <Matchup round="Semifinal" match={semifinals[1]} compact />
          <Matchup round="Quarterfinal" match={quarterfinals[1]} compact />
        </div>
      </CardContent>
    </Card>
  );
}
