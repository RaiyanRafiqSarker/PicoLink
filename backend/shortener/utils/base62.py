BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
BASE = len(BASE62_ALPHABET)
SEQUENCE_OFFSET = 100_000_000

def encode_base62(num: int) -> str:
    """Encodes a positive integer into a Base62 string."""
    if num == 0:
        return BASE62_ALPHABET[0]
    
    digits = []
    while num > 0:
        digits.append(BASE62_ALPHABET[num % BASE])
        num //= BASE
    
    return "".join(reversed(digits))

def decode_base62(token: str) -> int:
    """Decodes a Base62 string back into an integer."""
    res = 0
    for char in token:
        idx = BASE62_ALPHABET.find(char)
        if idx == -1:
            raise ValueError(f"Invalid Base62 character: {char}")
        res = res * BASE + idx
    return res
