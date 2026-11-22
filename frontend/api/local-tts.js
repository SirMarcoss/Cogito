import { handleTtsRequest } from "../neuralTtsPlugin.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ detail: "Metodo non consentito. Usa POST." }));
    return;
  }

  await handleTtsRequest(req, res);
}
