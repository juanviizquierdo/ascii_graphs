export interface LinearScale {
  domainMin: number;
  domainMax: number;
  rangeMin: number;
  rangeMax: number;
  map(value: number): number;
}

export function linearScale(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number,
): LinearScale {
  if (![domainMin, domainMax, rangeMin, rangeMax].every(Number.isFinite)) {
    throw new TypeError("linear scale bounds must be finite numbers.");
  }
  const domainSpan = domainMax - domainMin;
  const rangeSpan = rangeMax - rangeMin;
  return {
    domainMin,
    domainMax,
    rangeMin,
    rangeMax,
    map(value: number): number {
      if (!Number.isFinite(value)) {
        throw new TypeError("scale value must be a finite number.");
      }
      if (domainSpan === 0) return rangeMin + rangeSpan / 2;
      const ratio = (value - domainMin) / domainSpan;
      return rangeMin + ratio * rangeSpan;
    },
  };
}
