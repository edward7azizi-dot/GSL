// Playoff bracket data.
//
// Six teams: Crosby FC and Perliona FC earned byes straight to the semifinals,
// the other four played quarterfinals.
//
// To update after a game: set `winner` to the winning team's name, and fill in
// `date` (YYYY-MM-DD), `time` and `venue` once a fixture is scheduled. A null
// date renders as "TBD". The final's teams fill themselves in from the semifinal
// winners, so you only need to touch `date`/`time`/`venue`/`winner` there.

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
    { home: "Crosby FC", away: "Dieppe FC", winner: null, date: "2026-08-08", time: "7:00 PM", venue: "Rougecrest Park" },
    { home: "Perliona FC", away: "FC George Richardson", winner: null, date: "2026-08-08", time: "9:00 PM", venue: "Rougecrest Park" },
  ],
  final: { winner: null, date: null, time: null, venue: null },
};

// Teams that skipped the quarterfinals.
export const BYES = ["Crosby FC", "Perliona FC"];
