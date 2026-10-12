const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = BigInt(BASE62_CHARS.length);

/**
 * Encodes a numeric ID into a Base62 string.
 * @param id The auto-incrementing integer (Number or BigInt)
 * @returns Base62 encoded string (0-9, a-z, A-Z)
 */
export function encodeBase62(id: number | bigint | string): string {
  let num = BigInt(id);
  if (num === 0n) {
    return BASE62_CHARS[0];
  }
  if (num < 0n) {
    throw new Error('ID must be a non-negative integer for Base62 encoding');
  }

  let result = '';
  while (num > 0n) {
    const remainder = Number(num % BASE);
    result = BASE62_CHARS[remainder] + result;
    num = num / BASE;
  }

  return result;
}

/**
 * Decodes a Base62 string back to a numeric ID.
 * @param str Base62 string
 * @returns BigInt representation of the decoded ID
 */
export function decodeBase62(str: string): bigint {
  let num = 0n;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const index = BASE62_CHARS.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base62 character: "${char}"`);
    }
    num = num * BASE + BigInt(index);
  }
  return num;
}
