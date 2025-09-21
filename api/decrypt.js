import cypherTransposicao from "../app/src/transposicao.js";
import cypherVigenere from "../app/src/vigenere.js";
import cypherOpenssl from "../app/src/openssl.js";

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { text, password, algorithm } = getBody(req);
    if (!text || !password || !algorithm) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: text, password, algorithm" });
    }

    const openssl = await cypherOpenssl(text, password, algorithm, true);
    if (openssl.err && openssl.err.length > 0) {
      return res
        .status(500)
        .json({
          error: Buffer.concat(
            openssl.err.map((e) =>
              Buffer.isBuffer(e) ? e : Buffer.from(String(e))
            )
          ).toString(),
        });
    }

    const vigenere = cypherVigenere(openssl.buffer.toString(), password, true);
    const transposicao = cypherTransposicao(vigenere, password, true);

    return res.status(200).json({ decrypted: transposicao });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
