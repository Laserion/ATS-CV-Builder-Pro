import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/optimize-ats", async (req, res) => {
    const { content, jobDescription } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key no configurada en el servidor." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        Eres un experto en reclutamiento y sistemas ATS. 
        Optimiza el siguiente contenido de un CV para que sea más legible por máquinas y contenga palabras clave relevantes.
        ${jobDescription ? `Contexto del trabajo: ${jobDescription}` : 'Optimización general para sistemas ATS.'}
        
        Contenido actual:
        ${content}
        
        Por favor, devuelve una versión mejorada del texto, enfocándote en logros cuantificables y palabras clave de la industria.
        IMPORTANTE: Devuelve SOLO el texto optimizado, sin introducciones ni comentarios adicionales.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Error en Gemini API (Server):", error);
      res.status(500).json({ error: "Error al procesar con la IA." });
    }
  });

  app.post("/api/generate-cover-letter", async (req, res) => {
    const { cvData, jobInfo } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key no configurada en el servidor." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        Genera una carta de presentación profesional basada en los siguientes datos de CV:
        Nombre: ${cvData.name}
        Experiencia: ${JSON.stringify(cvData.experience)}
        Habilidades: ${cvData.skills.join(", ")}
        
        Para el puesto en la empresa: ${jobInfo.company}
        Dirigido a: ${jobInfo.recipient}
        Descripción del puesto: ${jobInfo.description}
        
        La carta debe ser persuasiva, profesional y resaltar cómo las habilidades del candidato resuelven los problemas de la empresa.
        IMPORTANTE: Devuelve SOLO el contenido de la carta, sin comentarios adicionales.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Error al generar carta (Server):", error);
      res.status(500).json({ error: "Error al generar la carta con la IA." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
