// server/routes/transcribe.js
import express from "express";
import Replicate from "replicate";
import { logError } from "../utils/logger.js";

const router = express.Router();
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

router.post("/transcribe", async (req, res) => {
  try {
    const { audioUrl } = req.body;
    if (!audioUrl)
      return res.status(400).json({ success: false, error: "Missing audioUrl" });

    console.log("🎧 Transcribing via a16z-infra/whisper:", audioUrl);

    // 👇 this version id comes from the model page on replicate.com/a16z-infra/whisper
    const model =
      "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e";

    const prediction = await replicate.run(model, {
      input: {
        audio: audioUrl,
        task: "transcribe",
        language: "en",
      },
    });

    res.json({
      success: true,
      text: Array.isArray(prediction)
        ? prediction.join(" ")
        : prediction.text || prediction,
    });
  } catch (err) {
  await logError({
    service: "transcription",
    message: err.message,
    meta: { stack: err.stack },
  });

  throw err;
}
});

export default router;
