import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "crypto";

// Map algorithm to key and iv sizes in bytes
function getSizes(algorithm) {
  switch (algorithm) {
    case "aes-128-cbc":
      return { keyLen: 16, ivLen: 16 };
    case "aes-192-cbc":
      return { keyLen: 24, ivLen: 16 };
    case "aes-256-cbc":
      return { keyLen: 32, ivLen: 16 };
    case "des-ede-cbc": // 2-key 3DES
      return { keyLen: 16, ivLen: 8 };
    case "des-ede3-cbc": // 3-key 3DES
      return { keyLen: 24, ivLen: 8 };
    default:
      throw new Error(`Algoritmo não suportado: ${algorithm}`);
  }
}

// Derive key and IV using PBKDF2-HMAC-SHA256 like "openssl enc -pbkdf2"
function deriveKeyIv(password, salt, algorithm) {
  const { keyLen, ivLen } = getSizes(algorithm);
  const totalLen = keyLen + ivLen;
  const derived = pbkdf2Sync(String(password), salt, 10000, totalLen, "sha256");
  return {
    key: derived.subarray(0, keyLen),
    iv: derived.subarray(keyLen, totalLen),
  };
}

export default async function cypherOpenssl(
  text,
  password,
  algorithm,
  decrypt = false
) {
  try {
    if (!decrypt) {
      const salt = randomBytes(8);
      const { key, iv } = deriveKeyIv(password, salt, algorithm);
      const cipher = createCipheriv(algorithm, key, iv);
      const input = Buffer.isBuffer(text) ? text : Buffer.from(String(text));
      const enc = Buffer.concat([cipher.update(input), cipher.final()]);
      // OpenSSL enc output: "Salted__" + 8-byte salt + ciphertext
      const out = Buffer.concat([Buffer.from("Salted__"), salt, enc]);
      return { err: [], buffer: out };
    } else {
      const input = Buffer.isBuffer(text) ? text : Buffer.from(text, "base64");
      if (input.length < 16 || input.subarray(0, 8).toString() !== "Salted__") {
        // Not the expected OpenSSL format
        return {
          err: [Buffer.from("Formato inválido: cabeçalho Salted__ ausente")],
          buffer: Buffer.alloc(0),
        };
      }
      const salt = input.subarray(8, 16);
      const ciphertext = input.subarray(16);
      const { key, iv } = deriveKeyIv(password, salt, algorithm);
      const decipher = createDecipheriv(algorithm, key, iv);
      const dec = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return { err: [], buffer: dec };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { err: [Buffer.from(msg)], buffer: Buffer.alloc(0) };
  }
}
