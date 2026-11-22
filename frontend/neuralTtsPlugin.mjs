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
const BODY_READ_TIMEOUT_MS = 10000;
const MAX_CACHE_ENTRIES = 160;

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
    .replace(/[\x00-\x1F\x7F]+/g, " ")
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

  const sentences = (text.match(/[^.!?…:;]+[.!?…:;]*/g) ?? [text])
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

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new HttpRequestError(408, "Timeout lettura richiesta TTS."));
    }, BODY_READ_TIMEOUT_MS);

    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(arg);
    };

    req.on("data", (chunk) => {
      if (settled) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_BODY_BYTES) {
        req.pause();
        req.removeAllListeners("data");
        finish(
          reject,
          new HttpRequestError(413, "Testo troppo lungo per la richiesta TTS."),
        );
        return;
      }
      chunks.push(buf);
    });

    req.on("end", () => {
      if (settled) return;
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        finish(resolve, raw ? JSON.parse(raw) : {});
      } catch {
        finish(reject, new HttpRequestError(400, "Corpo JSON non valido."));
      }
    });

    req.on("error", (err) => {
      finish(reject, err);
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

async function extractJsonBody(req) {
  if (req.body === undefined) {
    return readJsonBody(req);
  }
  if (typeof req.body === "string") {
    try {
      return req.body ? JSON.parse(req.body) : {};
    } catch {
      throw new HttpRequestError(400, "Corpo JSON non valido.");
    }
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      const raw = req.body.toString("utf8");
      return raw ? JSON.parse(raw) : {};
    } catch {
      throw new HttpRequestError(400, "Corpo JSON non valido.");
    }
  }
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  return {};
}

export async function handleTtsRequest(req, res) {
  try {
    const body = await extractJsonBody(req);
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
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.end(mp3Buffer);
  } catch (err) {
    if (res.writableEnded) return;
    const isClientError = err instanceof HttpRequestError;
    res.statusCode = isClientError ? err.statusCode : 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        detail: isClientError
          ? err.message
          : "Sintesi vocale neurale temporaneamente non disponibile.",
      }),
    );
  }
}

function attachTtsMiddleware(server) {
  server.middlewares.use("/api/local-tts", async (req, res, next) => {
    if (req.method !== "POST") {
      return next();
    }

    await handleTtsRequest(req, res);
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
