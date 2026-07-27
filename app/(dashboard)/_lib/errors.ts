/**
 * Plain-language error mapping for the authenticated app.
 *
 * RULE (Gate 4, microcopy): a user never sees a raw database string, a
 * PostgREST code, or an exception message. Every failure is named in plain
 * language AND paired with the thing the user can do next. Colour alone never
 * carries the meaning -- callers render these through <Notice>, which always
 * pairs the alert colour with an icon and the word for what happened.
 */

export interface FriendlyError {
  /** What went wrong, in the user's words. Never a DB string. */
  title: string
  /** What to do about it. Always actionable. */
  detail: string
}

interface MaybePostgrestError {
  code?: string
  message?: string
  name?: string
}

/**
 * Translate anything thrown by Supabase/fetch into something a person can act
 * on. `fallback` is what we say when we cannot recognise the failure -- it must
 * still name the recovery, so callers are forced to supply one.
 */
export function friendlyError(err: unknown, fallback: FriendlyError): FriendlyError {
  const e = (err ?? {}) as MaybePostgrestError
  const code = typeof e.code === 'string' ? e.code : ''
  const message = typeof e.message === 'string' ? e.message : ''

  // PostgREST: no rows returned from .single()
  if (code === 'PGRST116') {
    return {
      title: 'We could not find that',
      detail: 'It may have been removed, or the link may be out of date. Go back and pick it again from the list.'
    }
  }

  // Postgres: insufficient privilege / RLS denied the row
  if (code === '42501' || code === 'PGRST301' || /row-level security|permission denied/i.test(message)) {
    return {
      title: 'This is not yours to open',
      detail: 'You are signed in as a different account than the one this belongs to. Sign in again, or go back and choose one of your own.'
    }
  }

  // Postgres: unique violation
  if (code === '23505') {
    return {
      title: 'That already exists',
      detail: 'Nothing was lost -- the version already saved is still there. Refresh to see it.'
    }
  }

  // Postgres: foreign key / not-null violation -- a required piece is missing
  if (code === '23503' || code === '23502') {
    return {
      title: 'Something this needs is missing',
      detail: 'A required detail has not been filled in yet. Go back a step and complete it, then try again.'
    }
  }

  // Postgres: undefined column/table -- our bug, not theirs. Say so honestly.
  if (code === '42703' || code === '42P01' || code === 'PGRST200' || code === 'PGRST204') {
    return {
      title: 'This page is not working right now',
      detail: 'The problem is on our side, not yours. Nothing you entered was lost. Try again in a few minutes.'
    }
  }

  // Network / offline
  if (
    e.name === 'TypeError' ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(message)
  ) {
    return {
      title: 'We could not reach Laywork',
      detail: 'That usually means the connection dropped. Check your internet and reload the page -- nothing you typed was lost.'
    }
  }

  // Auth session expired
  if (code === '401' || /jwt|token|not authenticated|session/i.test(message)) {
    return {
      title: 'You have been signed out',
      detail: 'Sessions expire after a while for security. Sign in again and you will land right back here.'
    }
  }

  return fallback
}

/** Convenience: the message we show when a page load fails for no known reason. */
export function loadFailure(what: string, recovery: string): FriendlyError {
  return {
    title: `We could not load your ${what}`,
    detail: recovery
  }
}
