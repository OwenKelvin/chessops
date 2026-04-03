/**
 * Webhook event types for the chess tournament platform
 */
export const WebhookEvents = {
  // Tournament events
  TOURNAMENT_CREATED: 'tournament.created',
  TOURNAMENT_STARTED: 'tournament.started',
  TOURNAMENT_UPDATED: 'tournament.updated',
  TOURNAMENT_COMPLETED: 'tournament.completed',
  TOURNAMENT_CANCELLED: 'tournament.cancelled',

  // Round events
  ROUND_CREATED: 'round.created',
  ROUND_PUBLISHED: 'round.published',
  ROUND_COMPLETED: 'round.completed',

  // Pairing events
  PAIRINGS_GENERATED: 'pairings.generated',
  PAIRINGS_UPDATED: 'pairings.updated',

  // Match/Game events
  MATCH_CREATED: 'match.created',
  MATCH_STARTED: 'match.started',
  MATCH_COMPLETED: 'match.completed',
  MATCH_RESULT_SUBMITTED: 'match.result.submitted',
  MATCH_RESULT_UPDATED: 'match.result.updated',

  // Player events
  PLAYER_REGISTERED: 'player.registered',
  PLAYER_WITHDREW: 'player.withdrew',
  PLAYER_ADDED: 'player.added',
  PLAYER_REMOVED: 'player.removed',

  // Standings events
  STANDINGS_UPDATED: 'standings.updated',
  TIEBREAKS_CALCULATED: 'tiebreaks.calculated',
} as const;

export type WebhookEventType = (typeof WebhookEvents)[keyof typeof WebhookEvents];
