export async function optimizeForATS(content: string, jobDescription?: string) {
  try {
    const response = await fetch("/api/optimize-ats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, jobDescription }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error en el servidor");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error en optimizeForATS:", error);
    throw error;
  }
}

export async function generateCoverLetter(cvData: any, jobInfo: { recipient: string, company: string, description: string }) {
  try {
    const response = await fetch("/api/generate-cover-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData, jobInfo }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error en el servidor");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error en generateCoverLetter:", error);
    throw error;
  }
}
