import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cvData, jobInfo } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API Key no configurada en el servidor de Vercel." });
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

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error en Vercel API (Cover Letter):", error);
    const errorMessage = error.message || "Error desconocido al generar la carta";
    return res.status(500).json({ error: `Fallo en la IA: ${errorMessage}` });
  }
}
