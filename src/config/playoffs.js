// Playoff bracket data.
//
// Six teams: Crosby FC and Perliona FC earned byes straight to the semifinals,
// the other four played quarterfinals.
//
// To update after a game: set `winner` to the winning team's name, plus
// `homeScore`/`awayScore`. Fill in `date` (YYYY-MM-DD), `time` and `venue` once
// a fixture is scheduled — a null date renders as "TBD". The final's teams fill
// themselves in from the semifinal winners, so there you only ever touch
// `date`/`time`/`venue`/`winner`/scores.

export const TEAM_LOGOS = {
  "Crosby FC": "/images/teams/crosby-fc.png",
  "Dieppe FC": "/images/teams/dieppe-fc.png",
  "Malavan": "/images/teams/malavan.png",
  "Perliona FC": "/images/teams/perliona-fc.png",
  "FC George Richardson": "/images/teams/fc-george-richardson.png",
  "Selvan XI": "/images/teams/selvan-xi.png",
};

export const PLAYOFF_BRACKET = {
  // Left side of the bracket, then right side.
  quarterfinals: [
    { home: "Dieppe FC", away: "Malavan", winner: "Dieppe FC", date: "2026-08-01", time: "7:00 PM", venue: "Rougecrest Park" },
    { home: "FC George Richardson", away: "Selvan XI", winner: "FC George Richardson", date: "2026-08-01", time: "9:00 PM", venue: "Rougecrest Park" },
  ],
  semifinals: [
    { home: "Crosby FC", away: "Dieppe FC", homeScore: 4, awayScore: 3, winner: "Crosby FC", date: "2026-08-08", time: "7:00 PM", venue: "Rougecrest Park" },
    { home: "Perliona FC", away: "FC George Richardson", homeScore: 5, awayScore: 2, winner: "Perliona FC", date: "2026-08-08", time: "9:00 PM", venue: "Rougecrest Park" },
  ],
  final: { homeScore: null, awayScore: null, winner: null, date: "2026-08-15", time: "9:00 PM", venue: "Sheppard's Bush" },
};

// Teams that skipped the quarterfinals.
export const BYES = ["Crosby FC", "Perliona FC"];
