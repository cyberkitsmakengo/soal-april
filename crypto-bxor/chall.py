import os


def rotr(byte_val, shift):
    return ((byte_val >> shift) | (byte_val << (8 - shift))) & 0xFF


def rotl(byte_val, shift):
    return ((byte_val << shift) | (byte_val >> (8 - shift))) & 0xFF


plaintext = "CTF{まんたっぷじわ}"
pt_bytes = plaintext.encode("utf-8")

if len(pt_bytes) % 2 != 0:
    pt_bytes += b"\x00"

mid = len(pt_bytes) // 2
l = pt_bytes[:mid]
r = pt_bytes[mid:]

l_rot = bytes([rotr(b, 6) for b in l])
r_rot = bytes([rotl(b, 5) for b in r])

# key
k1 = ord(os.urandom(1))
k2 = ord(os.urandom(1))
k3 = ord(os.urandom(1))

r_final = bytes([l ^ r for l, r in zip(l_rot, r_rot)])
l_final = bytes([b ^ k1 ^ k2 ^ k3 for b in l_rot])

ciphertext = l_final + r_final
print(f"chiphertext : {ciphertext.hex()}")
