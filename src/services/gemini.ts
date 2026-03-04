import { GoogleGenAI } from "@google/genai";

export async function optimizeForATS(content: string, jobDescription?: string) {
  // Usar la variable de entorno proporcionada por la plataforma
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ Error: API Key no encontrada.");
    throw new Error("No se encontró una API Key válida. Asegúrate de que la variable GEMINI_API_KEY esté configurada en tu entorno.");
  }

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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    if (!response.text) throw new Error("La IA respondió pero el texto está vacío.");
    return response.text;
  } catch (error) {
    console.error("Error en la llamada a Gemini API:", error);
    throw error;
  }
}

export async function generateCoverLetter(cvData: any, jobInfo: { recipient: string, company: string, description: string }) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key no configurada.");
  }

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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    if (!response.text) throw new Error("Respuesta de IA vacía.");
    return response.text;
  } catch (error) {
    console.error("Error al generar carta:", error);
    throw error;
  }
}
