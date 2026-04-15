#!/usr/bin/env node

const arg = process.argv[2] || "";

const kA = [0x13, 0x37, 0xC0, 0xDE];
const kB = [0x42, 0x99, 0xAB];
const KEY = kA.concat(kB);

const ORDER = [25, 14, 27, 4, 28, 2, 15, 26, 5, 16, 3, 12, 21, 10, 23, 0, 13, 24, 11, 22, 1, 29, 31, 8, 17, 6, 19, 30, 9, 20, 7, 18];
const EXPECT = [182, 117, 178, 34, 63, 164, 197, 227, 104, 248, 213, 241, 207, 8, 58, 130, 73, 210, 235, 95, 83, 134, 227, 84, 25, 240, 123, 70, 175, 122, 148, 220];

function rotl3(x) {
  return ((x << 3) & 0xff) | (x >>> 5);
}

function mix(input) {
  const bytes = Buffer.from(input, "utf8");
  if (bytes.length !== 32) return null;

  const transformed = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    let v = bytes[i] ^ KEY[i % KEY.length];
    v = (v + ((i * 7) & 0xff)) & 0xff;
    transformed[i] = rotl3(v);
  }

  const out = new Array(transformed.length);
  for (let i = 0; i < ORDER.length; i++) {
    out[i] = transformed[ORDER[i]];
  }
  return out;
}

function validate(input) {
  if (!input.startsWith("CTF{")) return false;
  if (!input.endsWith("}")) return false;

  const got = mix(input);
  if (!got || got.length !== EXPECT.length) return false;

  for (let i = 0; i < EXPECT.length; i++) {
    if (got[i] !== EXPECT[i]) return false;
  }
  return true;
}

if (validate(arg)) {
  console.log("correct flag");
} else {
  console.log("wrong");
}
