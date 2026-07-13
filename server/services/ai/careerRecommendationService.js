// DEPENDENCIES
const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// AI RESPONSE SCHEMA
const recommendationSchema = {
  type: Type.OBJECT,
  properties: {
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          careerRoleId: {
            type: Type.INTEGER,
          },
          matchScore: {
            type: Type.INTEGER,
          },
          reason: {
            type: Type.STRING,
          },
          matchedSkills: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
          missingSkills: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        },
        required: [
          "careerRoleId",
          "matchScore",
          "reason",
          "matchedSkills",
          "missingSkills",
        ],
      },
    },
  },
  required: ["recommendations"],
};

/**
 * Normalizes text for lightweight candidate matching.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Produces a basic keyword-overlap score so we do not send
 * every O*NET occupation to Gemini.
 *
 * This is only a candidate-narrowing score. Gemini produces
 * the final résumé-specific match score.
 *
 * @param {object} careerRole
 * @param {string[]} resumeTerms
 * @returns {number}
 */
function calculateCandidateScore(careerRole, resumeTerms) {
  const careerText = normalizeText(
    `${careerRole.title} ${careerRole.description}`
  );

  let score = 0;

  for (const term of resumeTerms) {
    const normalizedTerm = normalizeText(term);

    if (!normalizedTerm || normalizedTerm.length < 2) {
      continue;
    }

    if (careerText.includes(normalizedTerm)) {
      score += normalizedTerm.includes(" ")
        ? 4
        : 2;
    }
  }

  return score;
}

/**
 * Narrows the career catalog before sending candidates to AI.
 *
 * @param {object[]} careerRoles
 * @param {object} resumeProfile
 * @param {number} limit
 * @returns {object[]}
 */
function selectCareerCandidates(
  careerRoles,
  resumeProfile,
  limit = 60
) {
  const resumeTerms = [
    ...(resumeProfile.skills || []).map(
      (skill) => skill.name
    ),

    ...(resumeProfile.employmentHistory || []).map(
      (job) => job.jobTitle
    ),

    ...(resumeProfile.education || []).flatMap(
      (education) => [
        education.degree,
        education.fieldOfStudy,
      ]
    ),

    resumeProfile.professionalSummary,
  ].filter(Boolean);

  const scoredRoles = careerRoles.map((careerRole) => ({
    ...careerRole,
    candidateScore: calculateCandidateScore(
      careerRole,
      resumeTerms
    ),
  }));

  const matchedRoles = scoredRoles
    .filter((careerRole) => careerRole.candidateScore > 0)
    .sort(
      (first, second) =>
        second.candidateScore - first.candidateScore
    );

  // If keyword matching produces too few candidates,
  // include additional occupations so Gemini still has options.
  if (matchedRoles.length < 20) {
    const selectedIds = new Set(
      matchedRoles.map((careerRole) => careerRole.id)
    );

    const fallbackRoles = scoredRoles
      .filter(
        (careerRole) => !selectedIds.has(careerRole.id)
      )
      .slice(0, limit - matchedRoles.length);

    return [
      ...matchedRoles,
      ...fallbackRoles,
    ].slice(0, limit);
  }

  return matchedRoles.slice(0, limit);
}

/**
 * Asks Gemini to rank valid CareerRole records for one résumé.
 *
 * Gemini may only select IDs supplied in careerCandidates.
 *
 * @param {object} resumeProfile
 * @param {object[]} careerCandidates
 * @param {number} recommendationCount
 * @returns {Promise<object[]>}
 */
async function generateCareerRecommendations(
  resumeProfile,
  careerCandidates,
  recommendationCount = 9
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!careerCandidates.length) {
    throw new Error(
      "No career-role candidates are available."
    );
  }

  const allowedCareerRoleIds = new Set(
    careerCandidates.map((careerRole) => careerRole.id)
  );

  const resumeForPrompt = {
    professionalSummary:
      resumeProfile.professionalSummary || null,

    skills: (resumeProfile.skills || []).map(
      (skill) => ({
        name: skill.name,
        category: skill.category,
        level: skill.level,
      })
    ),

    employmentHistory:
      resumeProfile.employmentHistory || [],

    education:
      resumeProfile.education || [],
  };

  const careersForPrompt = careerCandidates.map(
    (careerRole) => ({
      careerRoleId: careerRole.id,
      onetSocCode: careerRole.onetSocCode,
      title: careerRole.title,
      description: careerRole.description,
    })
  );

  const prompt = `
You are ranking O*NET occupations for a résumé-based career application.

Select exactly ${recommendationCount} careers from the supplied candidate list.

Rules:
- You may only return careerRoleId values from the candidate list.
- Do not invent occupations.
- Rank the strongest overall career matches.
- Consider skills, work history, education, transferable experience, and career progression.
- matchScore must be an integer from 0 through 100.
- matchedSkills must contain résumé skills or clearly supported transferable capabilities.
- missingSkills must contain useful capabilities that would improve readiness for the role.
- Do not claim the applicant has a missing skill.
- Keep reasons brief and specific.
- Avoid returning several nearly identical careers unless they are genuinely the strongest matches.

Résumé profile:
${JSON.stringify(resumeForPrompt, null, 2)}

Allowed career candidates:
${JSON.stringify(careersForPrompt, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: recommendationSchema,
      temperature: 0.1,
    },
  });

  if (!response.text) {
    throw new Error(
      "Gemini returned an empty recommendation response."
    );
  }

  const result = JSON.parse(response.text);

  const validRecommendations = (
    result.recommendations || []
  )
    .filter((recommendation) =>
      allowedCareerRoleIds.has(
        recommendation.careerRoleId
      )
    )
    .map((recommendation) => ({
      careerRoleId: recommendation.careerRoleId,

      matchScore: Math.max(
        0,
        Math.min(
          100,
          Math.round(
            Number(recommendation.matchScore) || 0
          )
        )
      ),

      reason:
        String(recommendation.reason || "").trim(),

      matchedSkills: Array.isArray(
        recommendation.matchedSkills
      )
        ? recommendation.matchedSkills
        : [],

      missingSkills: Array.isArray(
        recommendation.missingSkills
      )
        ? recommendation.missingSkills
        : [],
    }))
    .sort(
      (first, second) =>
        second.matchScore - first.matchScore
    )
    .slice(0, recommendationCount);

  if (validRecommendations.length === 0) {
    throw new Error(
      "Gemini did not return any valid career recommendations."
    );
  }

  return validRecommendations.map(
    (recommendation, index) => ({
      ...recommendation,
      rank: index + 1,
    })
  );
}

module.exports = {
  selectCareerCandidates,
  generateCareerRecommendations,
};