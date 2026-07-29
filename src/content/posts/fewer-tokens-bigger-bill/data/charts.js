// Every number the fewer-tokens-bigger-bill charts draw, in one place next to
// the post that uses them. Nothing here is shared with any other post.

export const money2 = (v) => (v < 0 ? '-$' : '+$') + Math.abs(v).toFixed(2);
export const money3 = (v) => (v < 0 ? '-$' : '+$') + Math.abs(v).toFixed(3);
export const dollarTick = (t) =>
  t < 0 ? `-$${Math.abs(t)}` : t === 0 ? '$0' : `+$${t}`;

// TokenSplit: how much each arm sent, and how much of it arrived at full price
export const tokenSplit = {
  rows: [
    { arm: 'off', total: 215, share: 1.7 },
    { arm: 'on-cache', total: 191, share: 2.1 },
    { arm: 'on-token', total: 132, share: 7.4 },
  ],
  totalMax: 230, // 215M plus headroom, so no bar touches the right edge
  shareMax: 8,
};

// CostDeltaCI: the load-bearing chart. Delta is off minus on, so positive means
// headroom was cheaper.
export const costDelta = {
  domain: [-1, 2],
  ticks: [-1, 0, 1, 2],
  arms: [
    {
      key: 'on-cache', label: 'on-cache', role: 'control',
      mean: 0.73, median: 0.833, ci: [-0.249, 1.675],
      n: 25, p: 0.156, dz: 0.291, cheaper: 17, pricier: 8,
    },
    {
      key: 'on-token', label: 'on-token', role: 'treatment',
      mean: 0.367, median: -0.27, ci: [-0.674, 1.595],
      n: 22, p: 0.656, dz: 0.13, cheaper: 9, pricier: 13,
    },
  ],
};
costDelta.band = costDelta.arms[0].ci;

// CacheCancellation: what compression saved against what it destroyed
export const cacheCancellation = {
  domain: [-19, 19],
  ticks: [-15, 0, 15],
  rows: [
    { name: 'compression saving, as metered', v: 15.41, tone: 'accent' },
    { name: 'cache discount destroyed', v: -16.37, tone: 'warm' },
    { name: 'net', v: -0.96, tone: 'warm' },
  ],
};

// ClaimedVsRealized: the claim, the measured saving, and the clean-set truth
export const claimedVsRealized = {
  domain: [-12, 18],
  ticks: [-10, 0, 10],
  rows: [
    { name: "claimed by headroom's meter", v: 15.41, tone: 'grey' },
    { name: 'measured, all matched tasks', v: 8.13, tone: 'accent' },
    { name: 'measured, clean set only', v: -8.98, tone: 'warm' },
  ],
};

// MeterRatio: tokens removed against cost booked as saved
export const meterRatio = {
  domain: [0, 30],
  ticks: [0, 10, 20, 30],
  rows: [
    { name: 'production fleet dashboard', tokens: 10.1, cost: 19.4, ratio: '1.9x' },
    { name: 'recomputed from this benchmark', tokens: 9.7, cost: 24.7, ratio: '2.5x' },
  ],
};

export const TONE = {
  accent: 'var(--accent)',
  warm: 'var(--chart-warm)',
  grey: 'var(--chart-grey)',
};
