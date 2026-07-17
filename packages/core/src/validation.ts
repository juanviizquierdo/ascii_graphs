const MIN_WIDTH = 12;
const MAX_WIDTH = 500;
const MIN_HEIGHT = 1;
const MAX_HEIGHT = 500;
const MAX_DATA_POINTS = 10_000;

function hasUnsafeText(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return (
      code <= 0x1f ||
      (code >= 0x7f && code <= 0x9f) ||
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2066 && code <= 0x2069)
    );
  });
}

export function validateText(
  value: unknown,
  field: string,
  options: { allowEmpty?: boolean } = {},
): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string.`);
  }
  if (options.allowEmpty !== true && value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
  if (hasUnsafeText(value)) {
    throw new TypeError(
      `${field} cannot contain control, newline, or bidirectional formatting characters.`,
    );
  }
}

export function validateFiniteNumber(
  value: unknown,
  field: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${field} must be a finite number.`);
  }
}

export function validateWidth(width: number, field: string): void {
  if (!Number.isInteger(width) || width < MIN_WIDTH || width > MAX_WIDTH) {
    throw new RangeError(
      `${field} must be an integer between ${MIN_WIDTH} and ${MAX_WIDTH}.`,
    );
  }
}

export function validateHeight(height: number, field: string): void {
  if (!Number.isInteger(height) || height < MIN_HEIGHT || height > MAX_HEIGHT) {
    throw new RangeError(
      `${field} must be an integer between ${MIN_HEIGHT} and ${MAX_HEIGHT}.`,
    );
  }
}

export function validateDataLength(length: number, field = "data"): void {
  if (length > MAX_DATA_POINTS) {
    throw new RangeError(
      `${field} cannot contain more than ${MAX_DATA_POINTS} points.`,
    );
  }
}

export function validateViewport(
  width: number,
  height: number,
  maximumCells = 250_000,
): void {
  validateWidth(width, "layout width");
  validateHeight(height, "layout height");
  if (width * height > maximumCells) {
    throw new RangeError(
      `layout requires ${width * height} cells, exceeding the ${maximumCells} cell limit.`,
    );
  }
}
