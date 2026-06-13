type EventName =
  | 'wallet_connect'
  | 'wallet_disconnect'
  | 'policy_buy_start'
  | 'policy_buy_success'
  | 'policy_buy_error'
  | 'claim_submit'
  | 'claim_success'
  | 'claim_error'
  | 'product_view'
  | 'oracle_refresh';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export function track(event: EventName, properties?: EventProperties): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, properties);
  }
  // Stub: wire up PostHog / Mixpanel / custom analytics here
  // window.analytics?.track(event, properties);
}

export function page(name: string, properties?: EventProperties): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics:page]', name, properties);
  }
}
