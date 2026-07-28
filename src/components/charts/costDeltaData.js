// Shared numbers for the cost-delta chart, so the hand-rolled and Observable
// Plot renderings are compared on presentation alone and cannot drift apart.
export const arms = [
  {
    key: 'on-cache',
    label: 'on-cache',
    role: 'control',
    mean: 0.73,
    median: 0.833,
    ci: [-0.249, 1.675],
    n: 25,
    p: 0.156,
    dz: 0.291,
    cheaper: 17,
    pricier: 8,
  },
  {
    key: 'on-token',
    label: 'on-token',
    role: 'treatment',
    mean: 0.367,
    median: -0.27,
    ci: [-0.674, 1.595],
    n: 22,
    p: 0.656,
    dz: 0.13,
    cheaper: 9,
    pricier: 13,
  },
];

export const domain = [-1, 2];
export const band = arms[0].ci;
export const money = (v) => (v < 0 ? '-$' : '+$') + Math.abs(v).toFixed(3);
