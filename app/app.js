import express from "express";
import cors from "cors";
import cypherTransposicao from "./src/transposicao.js";
import cypherVigenere from "./src/vigenere.js";
import cypherOpenssl from "./src/openssl.js";

const app = express();
const PORT = 3000;

// CORS: allow requests from the browser client (adjust origin if you host elsewhere)
app.use(
  cors({
    origin: "*", // allow all origins (safe since credentials are false)
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// Handle preflight (Express 5: use regex instead of "*")
app.options(/.*/, cors());

app.use(express.json());

app.post("/app/encrypt", async (req, res) => {
  const { text, password, algorithm } = req.body;

  const transposicao = cypherTransposicao(text, password);
  const vigenere = cypherVigenere(transposicao, password);
  const openssl = await cypherOpenssl(vigenere, password, algorithm);

  if (openssl.err.length > 0)
    return res.status(500).json({ error: openssl.err.toString() });

  res.json({ encrypted: openssl.buffer.toString("base64") });
});

app.post("/app/decrypt", async (req, res) => {
  const { text, password, algorithm } = req.body;

  const openssl = await cypherOpenssl(
    Buffer.from(text, "base64"),
    password,
    algorithm,
    true
  );
  if (openssl.err.length > 0)
    return res.status(500).json({ error: openssl.err.toString() });

  const vigenere = cypherVigenere(openssl.buffer.toString(), password, true);
  const transposicao = cypherTransposicao(vigenere, password, true);

  res.json({ decrypted: transposicao });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
