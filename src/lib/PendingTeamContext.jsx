import React, { createContext, useContext, useState } from "react";

// Holds an in-flight team join while the user is on the claim / onboarding step.
// We DO NOT commit team_id to the user's profile until they complete a successful
// claim or finish the manual form — otherwise an X-out would leave them looking
// like they're on a team in the chat sidebar without ever finishing onboarding.
const PendingTeamContext = createContext({
  pendingTeam: null,
  setPendingTeam: () => {},
  clearPendingTeam: () => {},
});

export function PendingTeamProvider({ children }) {
  const [pendingTeam, setPendingTeamState] = useState(null);
  const setPendingTeam = (team) => setPendingTeamState(team);
  const clearPendingTeam = () => setPendingTeamState(null);
  return (
    <PendingTeamContext.Provider value={{ pendingTeam, setPendingTeam, clearPendingTeam }}>
      {children}
    </PendingTeamContext.Provider>
  );
}

export const usePendingTeam = () => useContext(PendingTeamContext);
