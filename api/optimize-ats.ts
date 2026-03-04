import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, jobDescription } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API Key no configurada en el servidor de Vercel." });
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
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error en Vercel API (Optimize):", error);
    // Return a more descriptive error message to the client
    const errorMessage = error.message || "Error desconocido en la comunicación con Gemini";
    return res.status(500).json({ error: `Fallo en la IA: ${errorMessage}` });
  }
}
