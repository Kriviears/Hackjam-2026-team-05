// DEPENDENCIES
const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// STRUCTURED RESPONSE SCHEMA
const resumeAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    professionalSummary: {
      type: Type.STRING,
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
          },
          category: {
            type: Type.STRING,
            nullable: true,
          },
          level: {
            type: Type.STRING,
            nullable: true,
          },
          confidence: {
            type: Type.NUMBER,
          },
        },
        required: ["name", "confidence"],
      },
    },
    employmentHistory: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: {
            type: Type.STRING,
          },
          jobTitle: {
            type: Type.STRING,
          },
          location: {
            type: Type.STRING,
            nullable: true,
          },
          startDate: {
            type: Type.STRING,
            nullable: true,
          },
          endDate: {
            type: Type.STRING,
            nullable: true,
          },
          isCurrentRole: {
            type: Type.BOOLEAN,
          },
          description: {
            type: Type.STRING,
            nullable: true,
          },
        },
        required: [
          "company",
          "jobTitle",
          "isCurrentRole",
        ],
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          institution: {
            type: Type.STRING,
          },
          degree: {
            type: Type.STRING,
            nullable: true,
          },
          fieldOfStudy: {
            type: Type.STRING,
            nullable: true,
          },
          startDate: {
            type: Type.STRING,
            nullable: true,
          },
          endDate: {
            type: Type.STRING,
            nullable: true,
          },
          description: {
            type: Type.STRING,
            nullable: true,
          },
        },
        required: ["institution"],
      },
    },
  },
  required: [
    "professionalSummary",
    "skills",
    "employmentHistory",
    "education",
  ],
};

/**
 * Sends extracted résumé text to Gemini and returns structured data.
 *
 * @param {string} rawResumeText
 * @returns {Promise<object>}
 */
async function analyzeResume(rawResumeText) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!rawResumeText?.trim()) {
    throw new Error("Résumé text is required for analysis.");
  }

  const prompt = `
You are analyzing a résumé for a career-planning application.

Extract only information clearly supported by the résumé.

Rules:
- Do not invent employers, dates, education, skills, or accomplishments.
- Use null for unknown optional values.
- Confidence must be between 0 and 1.
- Deduplicate skills.
- Normalize obvious skill names, such as "JS" to "JavaScript".
- Keep dates as strings because résumé dates may be incomplete.
- A skill's source will be stored separately as RESUME.

Résumé text:

${rawResumeText}
`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: resumeAnalysisSchema,
      temperature: 0.1,
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

  const result = JSON.parse(response.text);

  return {
    professionalSummary:
      result.professionalSummary?.trim() || "",
    skills: Array.isArray(result.skills) ? result.skills : [],
    employmentHistory: Array.isArray(result.employmentHistory)
      ? result.employmentHistory
      : [],
    education: Array.isArray(result.education)
      ? result.education
      : [],
  };
}

module.exports = {
  analyzeResume,
};