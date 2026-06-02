export type PolicyDecision = { allowed: true } | { allowed: false; reason: string };

export const canUpdateExample = (actorId: string | null): PolicyDecision => {
  if (!actorId) return { allowed: false, reason: 'authentication required' };
  return { allowed: true };
};
