import crypto from "node:crypto";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const ALLOWED_VOICES = new Set([
  "it-IT-IsabellaNeural",
  "it-IT-GiuseppeMultilingualNeural",
  "it-IT-DiegoNeural",
  "it-IT-ElsaNeural",
]);

const DEFAULT_VOICE = "it-IT-IsabellaNeural";
const MAX_TEXT_LENGTH = 4200;
const MAX_CHUNK_CHARS = 380;
const CHUNK_SPLIT_THRESHOLD = 360;
const PARALLEL_CHUNKS = 4;
const MAX_BODY_BYTES = 32768;
const MAX_CACHE_ENTRIES = 80;

// In-memory LRU audio cache & concurrent in-flight request deduplication
const audioCache = new Map();
const inFlightRequests = new Map();

class HttpRequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function sanitizeForSpeech(raw) {
  const normalized = raw
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, ", ")
    .replace(/\u00a0/g, " ")
    .replace(/&/g, " e ")
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= MAX_TEXT_LENGTH) {
    return normalized;
  }

  const sliced = normalized.slice(0, MAX_TEXT_LENGTH);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > MAX_TEXT_LENGTH * 0.7 ? sliced.slice(0, lastSpace) : sliced).trim();
}

function splitLongPiece(piece, maxLen) {
  const words = piece.split(" ");
  const out = [];
  let current = "";
  for (const w of words) {
    if (!current) {
      if (w.length <= maxLen) {
        current = w;
      } else {
        for (let i = 0; i < w.length; i += maxLen) {
          out.push(w.slice(i, i + maxLen));
        }
      }
    } else if (current.length + 1 + w.length <= maxLen) {
      current += " " + w;
    } else {
      out.push(current);
      if (w.length <= maxLen) {
        current = w;
      } else {
        for (let i = 0; i < w.length; i += maxLen) {
          out.push(w.slice(i, i + maxLen));
        }
        current = "";
      }
    }
  }
  if (current) out.push(current);
  return out;
}

function splitTextIntoBalancedChunks(text) {
  if (text.length <= CHUNK_SPLIT_THRESHOLD) {
    return [text];
  }

  const sentences = text
    .split(/(?<=[.!?…:;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const pieces = sentences.length > 0 ? sentences : [text];
  const chunks = [];
  let current = "";

  for (const sentence of pieces) {
    if (sentence.length > MAX_CHUNK_CHARS) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      chunks.push(...splitLongPiece(sentence, MAX_CHUNK_CHARS));
      continue;
    }

    if (!current) {
      current = sentence;
    } else if (current.length + 1 + sentence.length <= MAX_CHUNK_CHARS) {
      current += " " + sentence;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current) {
    chunks.push(current);
  }
  return chunks.length > 0 ? chunks : [text];
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function synthesizeSingleChunk(chunkText, voice, attempt = 0) {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(chunkText);
    const parts = [];
    for await (const chunk of audioStream) {
      parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(parts);
    if (buffer.length === 0) {
      throw new Error("Empty audio buffer synthesized");
    }
    return buffer;
  } catch (err) {
    if (attempt < 1) {
      await waitMs(250);
      return synthesizeSingleChunk(chunkText, voice, attempt + 1);
    }
    throw err;
  } finally {
    try {
      tts.close();
    } catch {
      // Ignore close cleanup errors
    }
  }
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  const runner = async () => {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await worker(items[idx], idx);
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runner(),
  );
  await Promise.all(workers);
  return results;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    req.on("data", (chunk) => {
      if (settled) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_BODY_BYTES) {
        settled = true;
        reject(new HttpRequestError(413, "Testo troppo lungo per la richiesta TTS."));
        return;
      }
      chunks.push(buf);
    });

    req.on("end", () => {
      if (settled) return;
      settled = true;
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new HttpRequestError(400, "Corpo JSON non valido."));
      }
    });

    req.on("error", (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
  });
}

async function synthesizeEdgeMp3(text, voice) {
  const key = crypto
    .createHash("sha256")
    .update(`${voice}:${text}`)
    .digest("hex");

  const cached = audioCache.get(key);
  if (cached) {
    audioCache.delete(key);
    audioCache.set(key, cached);
    return cached;
  }

  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  const work = (async () => {
    const chunks = splitTextIntoBalancedChunks(text);
    const chunkBuffers =
      chunks.length === 1
        ? [await synthesizeSingleChunk(chunks[0], voice)]
        : await runWithConcurrency(chunks, PARALLEL_CHUNKS, (c) =>
            synthesizeSingleChunk(c, voice),
          );

    const buffer = Buffer.concat(chunkBuffers);
    if (buffer.length === 0) {
      throw new Error("Empty combined audio buffer synthesized");
    }

    if (audioCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = audioCache.keys().next().value;
      if (oldestKey) audioCache.delete(oldestKey);
    }
    audioCache.set(key, buffer);
    return buffer;
  })();

  inFlightRequests.set(key, work);
  try {
    return await work;
  } finally {
    inFlightRequests.delete(key);
  }
}

function attachTtsMiddleware(server) {
  server.middlewares.use("/api/local-tts", async (req, res, next) => {
    if (req.method !== "POST") {
      return next();
    }

    try {
      const body = await readJsonBody(req);
      if (!body || typeof body.text !== "string") {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ detail: "Campo 'text' mancante o non valido." }));
        return;
      }

      const cleanText = sanitizeForSpeech(body.text);
      if (!cleanText) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ detail: "Testo mancante per la sintesi vocale." }));
        return;
      }

      const requestedVoice =
        typeof body.voice === "string" && ALLOWED_VOICES.has(body.voice)
          ? body.voice
          : DEFAULT_VOICE;

      const mp3Buffer = await synthesizeEdgeMp3(cleanText, requestedVoice);
      if (res.writableEnded) return;
      res.statusCode = 200;
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", String(mp3Buffer.length));
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.end(mp3Buffer);
    } catch (err) {
      if (res.writableEnded) return;
      res.statusCode = err instanceof HttpRequestError ? err.statusCode : 502;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          detail:
            err instanceof Error
              ? err.message
              : "Sintesi vocale neurale temporaneamente non disponibile.",
        }),
      );
    }
  });
}

export function neuralTtsPlugin() {
  return {
    name: "cogito-neural-tts-middleware",
    configureServer(server) {
      attachTtsMiddleware(server);
    },
    configurePreviewServer(server) {
      attachTtsMiddleware(server);
    },
  };
}
