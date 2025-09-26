const RIPPLE_EPOCH = 946684800;

export function toRippleTime(date: Date): number {
  return Math.floor(date.getTime() / 1000) - RIPPLE_EPOCH;
}

export function fromRippleTime(rippleTime: number): Date {
  return new Date((rippleTime + RIPPLE_EPOCH) * 1000);
}
