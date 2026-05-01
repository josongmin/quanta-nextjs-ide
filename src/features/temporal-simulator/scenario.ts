// Auto-derive what-if scenarios from the existing cache-tag store.
//
// For every cache-tag with at least one producer that has a `revalidate`
// window, we synthesize a 4-event timeline:
//   t=0   – User A mutation
//   t=1   – revalidateTag(...) call (only if the tag has an invalidator)
//   t=N/2 – User B page request
//   t=N   – User C page request
// where N is `min(120, revalidateSec * 2)`.
import type { CacheTag } from '@shared/types';
import type { Timeline, TimelineEvent } from './types';

const ROUTE_LABELS: Record<string, string> = {
  route_products: '/products',
  route_products_id: '/products/[id]',
  route_home: '/',
  route_admin_products: '/admin/products',
  route_admin_users: '/admin/users',
  route_dashboard: '/dashboard',
  route_checkout: '/checkout',
};

function labelFor(routeId: string): string {
  return ROUTE_LABELS[routeId] ?? routeId.replace(/^route_/, '/');
}

function pickRevalidate(tag: CacheTag): number {
  for (const p of tag.producers) {
    if (typeof p.revalidate === 'number' && p.revalidate > 0) return p.revalidate;
  }
  // Conservative default.
  return 60;
}

export function buildTimelineForTag(tag: CacheTag): Timeline {
  const revalidateSec = pickRevalidate(tag);
  const horizonSec = Math.min(180, Math.max(30, revalidateSec * 2));
  const hasInvalidator = tag.invalidators.length > 0;

  const events: TimelineEvent[] = [
    {
      id: `${tag.id}_ev_mut`,
      user: 'User A (admin)',
      kind: 'mutation',
      t: 0,
      tag: tag.name,
      label: `mutate ${tag.name}`,
    },
  ];

  if (hasInvalidator) {
    events.push({
      id: `${tag.id}_ev_rev`,
      user: 'User A (admin)',
      kind: 'revalidate-tag',
      t: 1,
      tag: tag.name,
      label: `revalidateTag('${tag.name}')`,
    });
  }

  events.push({
    id: `${tag.id}_ev_b`,
    user: 'User B (visitor)',
    kind: 'page-request',
    t: Math.round(horizonSec / 4),
    label: 'GET page',
  });

  events.push({
    id: `${tag.id}_ev_c`,
    user: 'User C (visitor)',
    kind: 'page-request',
    t: Math.round((horizonSec * 3) / 4),
    label: 'GET page',
  });

  // If the tag has no invalidator AND no producer-side revalidate, simulate a
  // long-stale scenario by removing the implicit one-second revalidate.
  if (!hasInvalidator && revalidateSec >= 120) {
    events.push({
      id: `${tag.id}_ev_d`,
      user: 'User D (visitor)',
      kind: 'page-request',
      t: horizonSec - 1,
      label: 'GET page',
    });
  }

  const routes = tag.affectedRouteIds.length
    ? tag.affectedRouteIds.map((id) => ({ id, label: labelFor(id) }))
    : [{ id: `${tag.id}_route`, label: `(uses ${tag.name})` }];

  return {
    id: `tl_${tag.id}`,
    title: `Tag: ${tag.name}`,
    tag: tag.name,
    horizonSec,
    revalidateSec,
    events,
    routes,
  };
}

export function buildTimelinesForTags(tags: CacheTag[]): Timeline[] {
  const out: Timeline[] = [];
  for (const tag of tags) {
    if (tag.affectedRouteIds.length === 0 && tag.producers.length === 0) continue;
    out.push(buildTimelineForTag(tag));
  }
  return out;
}
