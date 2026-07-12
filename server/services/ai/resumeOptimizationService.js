// DEPENDENCIES
const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// AI RESPONSE SCHEMA
const optimizationSchema = {
  type: Type.OBJECT,

  properties: {

    matchScore: {
      type: Type.INTEGER,
    },

    matchedKeywords: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },

    missingKeywords: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },

    suggestedActions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,

        properties: {
          title: {
            type: Type.STRING,
          },

          description: {
            type: Type.STRING,
          }
        },

        required: [
          "title",
          "description"
        ]
      }
    }

  },

  required: [
    "matchScore",
    "matchedKeywords",
    "missingKeywords",
    "suggestedActions"
  ]
};

/**
 * Generates résumé optimization data for one selected career.
 *
 * @param {object} resumeProfile
 * @param {object} selectedCareer
 * @returns {Promise<object>}
 */
async function generateResumeOptimization(
  resumeProfile,
  selectedCareer
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!selectedCareer) {
    throw new Error("A selected career is required.");
  }

  if (!resumeProfile) {
    throw new Error("Résumé profile is required.");
  }

  const resumeForPrompt = {
    professionalSummary:
      resumeProfile.professionalSummary || null,

    skills: Array.isArray(resumeProfile.skills)
      ? resumeProfile.skills.map((skill) => ({
          name: skill.name,
          category: skill.category || null,
          level: skill.level || null,
        }))
      : [],

    employmentHistory:
      resumeProfile.employmentHistory || [],

    education:
      resumeProfile.education || [],
  };

  const careerForPrompt = {
    id: selectedCareer.id,
    onetSocCode: selectedCareer.onetSocCode || null,
    title: selectedCareer.title,
    description: selectedCareer.description || null,
  };

  const prompt = `
You are optimizing a résumé for one selected career.

Compare the résumé profile with the selected career.

Return:
- matchScore: an integer from 0 through 100
- matchedKeywords: important résumé keywords already supported by the résumé
- missingKeywords: important career-related keywords not clearly supported by the résumé
- suggestedActions: practical résumé improvement actions

Rules:
- Use only information supported by the résumé.
- Do not invent skills, experience, employers, education, or accomplishments.
- Do not place a keyword in both matchedKeywords and missingKeywords.
- Deduplicate all keywords.
- Keep keywords concise.
- Suggested actions must be specific and practical.
- Suggested actions should improve the résumé for the selected career.
- Do not tell the user to falsely claim experience.
- Return between 3 and 6 suggested actions.
- Keep each action title short.
- Keep each action description to one or two sentences.

Résumé profile:
${JSON.stringify(resumeForPrompt, null, 2)}

Selected career:
${JSON.stringify(careerForPrompt, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: optimizationSchema,
      temperature: 0.1,
    },
  });

  if (!response.text) {
    throw new Error(
      "Gemini returned an empty optimization response."
    );
  }

  const result = JSON.parse(response.text);

  return {
    matchScore: Math.max(
      0,
      Math.min(
        100,
        Math.round(Number(result.matchScore) || 0)
      )
    ),

    matchedKeywords: Array.isArray(
      result.matchedKeywords
    )
      ? result.matchedKeywords
      : [],

    missingKeywords: Array.isArray(
      result.missingKeywords
    )
      ? result.missingKeywords
      : [],

    suggestedActions: Array.isArray(
      result.suggestedActions
    )
      ? result.suggestedActions.map((action) => ({
          title: String(action.title || "").trim(),
          description: String(
            action.description || ""
          ).trim(),
        }))
      : [],
  };
}

module.exports = {
  generateResumeOptimization,
};