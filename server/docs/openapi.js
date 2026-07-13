/**
 * OpenAPI 3.1 document for The Per Scholian Backend API.
 *
 * This file is hand-authored (not auto-generated) to keep full control
 * over descriptions, examples, and schema reuse. Organized as:
 *   1. Reusable schemas (components.schemas)
 *   2. Reusable responses (components.responses)
 *   3. Paths, grouped in the same order as routes/index.js
 */

// ---------------------------------------------------------------------------
// REUSABLE SCHEMAS
// ---------------------------------------------------------------------------

const schemas = {
  // ---- Errors -------------------------------------------------------------
  ErrorResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Something went wrong." },
      error: { type: "string", example: "Detailed error message (not always present)." },
    },
    required: ["message"],
  },

  // ---- Auth / Users --------------------------------------------------------
  User: {
    type: "object",
    description: "Sanitized user object (never includes the password hash).",
    properties: {
      id: { type: "integer", example: 1 },
      githubId: { type: "string", nullable: true, example: null },
      username: { type: "string", example: "keoki" },
      email: { type: "string", format: "email", example: "keoki@example.com" },
      displayName: { type: "string", nullable: true, example: "Keoki K." },
      avatarUrl: { type: "string", nullable: true, format: "uri" },
      stage: { type: "string", nullable: true, example: "Current Learner" },
      careerGoal: { type: "string", nullable: true, example: "Software Developer" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  AuthTokenResponse: {
    type: "object",
    properties: {
      token: { type: "string", description: "JWT to send as `Authorization: Bearer <token>`." },
      user: { $ref: "#/components/schemas/User" },
    },
  },

  DashboardResponse: {
    type: "object",
    properties: {
      user: {
        type: "object",
        properties: {
          id: { type: "integer" },
          username: { type: "string" },
          email: { type: "string" },
          stage: { type: "string", example: "Current Learner" },
          careerGoal: { type: "string", example: "Software Developer" },
        },
      },
      progress: {
        type: "object",
        properties: {
          percentage: { type: "integer", example: 67 },
          label: { type: "string", example: "Career Readiness" },
        },
      },
      nextSteps: {
        type: "array",
        items: { type: "string" },
        example: ["Build portfolio project", "Improve GitHub profile"],
      },
      milestones: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            completed: { type: "boolean" },
          },
        },
      },
    },
  },

  // ---- Roadmaps -------------------------------------------------------------
  Roadmap: {
    type: "object",
    properties: {
      title: { type: "string", example: "Your Future Journey" },
      currentStage: { type: "string", example: "Current Learner" },
      goal: { type: "string", example: "Software Developer" },
      milestones: {
        type: "array",
        items: { type: "string" },
        example: [
          "Complete core technical training",
          "Build portfolio project",
          "Improve GitHub profile",
          "Practice technical interviews",
          "Apply to aligned employer opportunities",
          "Return as a mentor",
        ],
      },
    },
  },

  // ---- Careers ---------------------------------------------------------------
  BlsMeta: {
    type: "object",
    properties: {
      occupationCodeAvailable: { type: "boolean" },
      salaryAvailable: { type: "boolean" },
      employmentProjectionAvailable: { type: "boolean" },
      lookupAttempted: { type: "boolean" },
      lookupAttemptedAt: { type: "string", format: "date-time", nullable: true },
      lookupError: { type: "string", nullable: true },
      salarySource: {
        type: "string",
        enum: ["DATABASE", "BLS_API", "STALE_DATABASE_CACHE", "UNAVAILABLE"],
      },
      salaryRefreshed: { type: "boolean" },
      error: { type: "string", nullable: true },
    },
  },

  CareerSalary: {
    type: "object",
    properties: {
      minimum: { type: "number", nullable: true, example: 68000 },
      maximum: { type: "number", nullable: true, example: 112000 },
      source: { type: "string", nullable: true, example: "BLS OEWS" },
      cachedAt: { type: "string", format: "date-time", nullable: true },
    },
  },

  Career: {
    type: "object",
    properties: {
      id: { type: "integer", example: 123 },
      onetSocCode: { type: "string", example: "15-1252.00" },
      blsOccupationCode: { type: "string", nullable: true, example: "15-1252" },
      title: { type: "string", example: "Software Developer" },
      description: { type: "string" },
      lucideIcon: { type: "string", nullable: true, example: "Code2" },
      salary: { $ref: "#/components/schemas/CareerSalary" },
      employmentGrowthPercent: { type: "number", nullable: true, example: 25.7 },
      jobOutlook: { type: "string", nullable: true, example: "Much faster than average" },
      bls: { $ref: "#/components/schemas/BlsMeta" },
      targetScore: { type: "number", nullable: true, example: 70 },
      sources: {
        type: "object",
        properties: {
          occupation: { type: "string", nullable: true, example: "O*NET" },
          wages: { type: "string", nullable: true, example: "BLS OEWS" },
        },
      },
      sourceUpdatedAt: { type: "string", format: "date-time", nullable: true },
    },
  },

  CareerListResponse: {
    type: "object",
    properties: {
      count: { type: "integer", example: 20 },
      roles: {
        type: "array",
        items: { $ref: "#/components/schemas/Career" },
      },
    },
  },

  CareerDetailResponse: {
    type: "object",
    properties: {
      career: { $ref: "#/components/schemas/Career" },
    },
  },

  // ---- Resumes -----------------------------------------------------------
  Resume: {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      originalFileName: { type: "string", example: "keoki-resume.pdf" },
      mimeType: { type: "string", example: "application/pdf" },
      fileSize: { type: "integer", example: 245678 },
      processingStatus: {
        type: "string",
        enum: ["PROCESSING", "COMPLETED", "FAILED"],
      },
      processingError: { type: "string", nullable: true },
      uploadedAt: { type: "string", format: "date-time" },
    },
  },

  ResumeUploadResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Résumé uploaded and text extracted successfully." },
      resume: { $ref: "#/components/schemas/Resume" },
      analysis: {
        type: "object",
        properties: {
          id: { type: "integer" },
          status: { type: "string", example: "COMPLETED" },
          textLength: { type: "integer", example: 3452 },
          rawExtractedText: { type: "string" },
        },
      },
    },
  },

  Skill: {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string", example: "JavaScript" },
      category: { type: "string", nullable: true, example: "Programming Language" },
      level: { type: "string", nullable: true, example: "Intermediate" },
      source: { type: "string", example: "RESUME" },
      confidence: { type: "number", nullable: true, example: 0.92 },
      confirmedByUser: { type: "boolean" },
    },
  },

  EmploymentHistoryEntry: {
    type: "object",
    properties: {
      id: { type: "integer" },
      company: { type: "string", example: "Acme Corp" },
      jobTitle: { type: "string", example: "Junior Developer" },
      location: { type: "string", nullable: true, example: "Remote" },
      startDate: { type: "string", nullable: true, example: "2023-01" },
      endDate: { type: "string", nullable: true, example: "2024-06" },
      isCurrentRole: { type: "boolean" },
      description: { type: "string", nullable: true },
      confirmedByUser: { type: "boolean" },
    },
  },

  EducationEntry: {
    type: "object",
    properties: {
      id: { type: "integer" },
      institution: { type: "string", example: "Per Scholas" },
      degree: { type: "string", nullable: true, example: "Certificate" },
      fieldOfStudy: { type: "string", nullable: true, example: "Software Engineering" },
      startDate: { type: "string", nullable: true },
      endDate: { type: "string", nullable: true },
      description: { type: "string", nullable: true },
      confirmedByUser: { type: "boolean" },
    },
  },

  ResumeAnalysisResponse: {
    type: "object",
    properties: {
      resume: { $ref: "#/components/schemas/Resume" },
      analysis: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "integer" },
          analysisStatus: {
            type: "string",
            enum: ["PROCESSING", "COMPLETED", "FAILED"],
          },
          professionalSummary: { type: "string", nullable: true },
          analysisError: { type: "string", nullable: true },
          analyzedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      skills: {
        type: "array",
        items: { $ref: "#/components/schemas/Skill" },
      },
      employmentHistory: {
        type: "array",
        items: { $ref: "#/components/schemas/EmploymentHistoryEntry" },
      },
      education: {
        type: "array",
        items: { $ref: "#/components/schemas/EducationEntry" },
      },
    },
  },

  RawTextResponse: {
    type: "object",
    properties: {
      resumeId: { type: "integer" },
      originalFileName: { type: "string" },
      rawExtractedText: { type: "string", nullable: true },
    },
  },

  // ---- Recommendations -----------------------------------------------------
  RoleRecommendation: {
    type: "object",
    properties: {
      recommendationId: { type: "integer", example: 55 },
      rank: { type: "integer", example: 1 },
      matchScore: { type: "number", example: 82.5 },
      reason: { type: "string", example: "Strong alignment on JavaScript, React, and API design skills." },
      selected: { type: "boolean" },
      matchedSkills: { type: "array", items: { type: "string" }, example: ["JavaScript", "React"] },
      missingSkills: { type: "array", items: { type: "string" }, example: ["TypeScript", "AWS"] },
      career: { $ref: "#/components/schemas/Career" },
    },
  },

  RecommendationGenerateResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Career recommendations generated successfully." },
      resume: {
        type: "object",
        properties: {
          id: { type: "integer" },
          originalFileName: { type: "string" },
        },
      },
      candidateCount: { type: "integer", example: 60 },
      count: { type: "integer", example: 5 },
      recommendations: {
        type: "array",
        items: { $ref: "#/components/schemas/RoleRecommendation" },
      },
    },
  },

  RecommendationListResponse: {
    type: "object",
    properties: {
      resume: {
        type: "object",
        properties: {
          id: { type: "integer" },
          originalFileName: { type: "string" },
        },
      },
      count: { type: "integer" },
      recommendations: {
        type: "array",
        items: { $ref: "#/components/schemas/RoleRecommendation" },
      },
    },
  },

  RecommendationSelectResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Career selected successfully." },
      resume: {
        type: "object",
        properties: {
          id: { type: "integer" },
          originalFileName: { type: "string" },
        },
      },
      recommendation: { $ref: "#/components/schemas/RoleRecommendation" },
    },
  },

  // ---- Optimization --------------------------------------------------------
  SuggestedAction: {
    type: "object",
    properties: {
      suggestionId: { type: "integer" },
      action: { type: "string", example: "Add measurable impact: Quantify the results of your portfolio project." },
      completed: { type: "boolean" },
      order: { type: "integer" },
    },
  },

  ResumeOptimization: {
    type: "object",
    properties: {
      optimizationId: { type: "integer" },
      resumeId: { type: "integer" },
      resumeTitle: { type: "string" },
      resumeUploadDate: { type: "string", format: "date-time" },
      matchScore: { type: "number", example: 78 },
      previousMatchScore: { type: "number", nullable: true, example: 65 },
      targetScore: { type: "number", example: 70 },
      status: { type: "string", example: "COMPLETED" },
      careerChoice: {
        type: "object",
        properties: {
          careerRoleId: { type: "integer" },
          title: { type: "string", example: "Software Developer" },
          onetSocCode: { type: "string", nullable: true },
          lucideIcon: { type: "string", nullable: true },
        },
      },
      skills: { type: "array", items: { type: "string" } },
      matchedKeywords: { type: "array", items: { type: "string" } },
      missingKeywords: { type: "array", items: { type: "string" } },
      suggestedActions: {
        type: "array",
        items: { $ref: "#/components/schemas/SuggestedAction" },
      },
    },
  },

  ResumeOptimizationGenerateResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Résumé optimization generated successfully." },
      optimization: { $ref: "#/components/schemas/ResumeOptimization" },
    },
  },

  ResumeOptimizationGetResponse: {
    type: "object",
    properties: {
      optimization: { $ref: "#/components/schemas/ResumeOptimization" },
    },
  },

  // ---- Readiness report -----------------------------------------------------
  ReadinessMilestone: {
    type: "object",
    properties: {
      milestoneId: { type: "integer" },
      title: { type: "string", example: "Reach target match score" },
      status: { type: "string", enum: ["COMPLETED", "ACTIVE"] },
      completed: { type: "boolean" },
      order: { type: "integer" },
    },
  },

  ReadinessActionItem: {
    type: "object",
    properties: {
      actionItemId: { type: "integer" },
      lucideIcon: { type: "string", nullable: true, example: "FileCheck2" },
      type: { type: "string", example: "RESUME" },
      title: { type: "string" },
      description: { type: "string" },
      actionRoute: { type: "string", nullable: true },
      completed: { type: "boolean" },
      order: { type: "integer" },
    },
  },

  ReadinessReport: {
    type: "object",
    properties: {
      reportId: { type: "integer" },
      resumeId: { type: "integer" },
      resumeTitle: { type: "string" },
      readinessScore: { type: "number", example: 78 },
      previousScore: { type: "number", nullable: true, example: 65 },
      targetScore: { type: "number", example: 70 },
      percentile: { type: "number", nullable: true },
      careerChoice: {
        type: "object",
        properties: {
          careerRoleId: { type: "integer" },
          title: { type: "string" },
          lucideIcon: { type: "string", nullable: true },
        },
      },
      nextStep: {
        type: "object",
        properties: {
          title: { type: "string", example: "Maintain career readiness" },
          description: { type: "string" },
          actionLabel: { type: "string", example: "Review optimization" },
          actionRoute: { type: "string", nullable: true },
        },
      },
      personalizedActionList: {
        type: "array",
        items: { $ref: "#/components/schemas/ReadinessActionItem" },
      },
      milestones: {
        type: "array",
        items: { $ref: "#/components/schemas/ReadinessMilestone" },
      },
      generatedAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  ReadinessReportGenerateResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Readiness report generated successfully." },
      readinessReport: { $ref: "#/components/schemas/ReadinessReport" },
    },
  },

  ReadinessReportGetResponse: {
    type: "object",
    properties: {
      readinessReport: { $ref: "#/components/schemas/ReadinessReport" },
    },
  },
};

// ---------------------------------------------------------------------------
// REUSABLE RESPONSES (common error shapes, referenced across paths)
// ---------------------------------------------------------------------------

const responses = {
  BadRequest: {
    description: "The request was malformed (e.g. an invalid ID).",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: { message: "A valid résumé ID is required." },
      },
    },
  },
  Unauthorized: {
    description: "Authentication is required or the provided JWT is invalid/expired.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: { message: "Authentication required." },
      },
    },
  },
  NotFound: {
    description: "The requested resource does not exist, or does not belong to the authenticated user.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: { message: "Résumé not found." },
      },
    },
  },
  Conflict: {
    description: "The request could not be completed because a required prior step has not happened yet.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: { message: "The résumé must be analyzed before career recommendations can be generated." },
      },
    },
  },
  ServerError: {
    description: "Unexpected server error.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: { message: "Something went wrong.", error: "Internal error detail." },
      },
    },
  },
};

const bearerSecurity = [{ bearerAuth: [] }];
const resumeIdParam = {
  name: "resumeId",
  in: "path",
  required: true,
  schema: { type: "integer" },
  example: 1,
  description: "The ID of the résumé.",
};

// ---------------------------------------------------------------------------
// PATHS
// ---------------------------------------------------------------------------

const paths = {
  // ===== AUTH ================================================================
  "/auth/register": {
    post: {
      tags: ["Authentication"],
      summary: "Register a new user",
      description: "Creates a new local user account (hashed password) and returns a JWT.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["username", "email", "password"],
              properties: {
                username: { type: "string", example: "keoki" },
                email: { type: "string", format: "email", example: "keoki@example.com" },
                password: { type: "string", format: "password", example: "Password123!" },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Registration successful.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthTokenResponse" },
            },
          },
        },
        "400": {
          description: "Missing required fields.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "Username, email, and password are required." },
            },
          },
        },
        "500": {
          description: "Registration failed (e.g. duplicate username/email).",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
          },
        },
      },
    },
  },

  "/auth/login": {
    post: {
      tags: ["Authentication"],
      summary: "Login",
      description: "Authenticates using a username or email plus password, and returns a JWT.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                username: { type: "string", example: "keoki" },
                email: { type: "string", format: "email", example: "keoki@example.com" },
                password: { type: "string", format: "password", example: "Password123!" },
              },
              description: "Provide either `username` or `email`, plus `password`.",
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Login successful.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/AuthTokenResponse" } },
          },
        },
        "401": {
          description: "Invalid credentials.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "Invalid credentials." },
            },
          },
        },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/auth/github": {
    get: {
      tags: ["Authentication"],
      summary: "Begin GitHub OAuth",
      description: "Redirects the user to GitHub to authorize the application (`user:email` scope).",
      responses: {
        "302": { description: "Redirect to GitHub's OAuth consent screen." },
      },
    },
  },

  "/auth/github/callback": {
    get: {
      tags: ["Authentication"],
      summary: "GitHub OAuth callback",
      description:
        "GitHub redirects here after the user authorizes (or denies) access. On success, the backend " +
        "redirects to `FRONTEND_REDIRECT_URL` with a `token` query parameter containing the JWT.",
      parameters: [
        {
          name: "code",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Authorization code supplied by GitHub.",
        },
      ],
      responses: {
        "302": { description: "Redirect to the frontend with `?token=<JWT>`." },
        "401": {
          description: "GitHub authentication failed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
      },
    },
  },

  "/auth/failure": {
    get: {
      tags: ["Authentication"],
      summary: "GitHub authentication failure page",
      description: "Reached when GitHub OAuth fails; returns a JSON error.",
      responses: {
        "401": {
          description: "Authentication failed.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "GitHub authentication failed." },
            },
          },
        },
      },
    },
  },

  // ===== USERS ================================================================
  "/api/users/profile": {
    get: {
      tags: ["Users"],
      summary: "Get the authenticated user's profile",
      security: bearerSecurity,
      responses: {
        "200": {
          description: "Authenticated user profile.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Welcome back, Per Scholian." },
                  user: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  "/api/users/dashboard": {
    get: {
      tags: ["Users"],
      summary: "Get dashboard data",
      description: "Returns progress, next steps, and milestone data for the authenticated user's dashboard.",
      security: bearerSecurity,
      responses: {
        "200": {
          description: "Dashboard data returned successfully.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/DashboardResponse" } } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  // ===== ROADMAPS ================================================================
  "/api/roadmaps/demo": {
    get: {
      tags: ["Roadmaps"],
      summary: "Get demo career roadmap",
      description: "Returns a sample/static career roadmap for the authenticated user.",
      security: bearerSecurity,
      responses: {
        "200": {
          description: "Demo roadmap returned successfully.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Roadmap" } } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  // ===== RESUMES ================================================================
  "/api/resumes/upload": {
    post: {
      tags: ["Resumes"],
      summary: "Upload a résumé",
      description:
        "Uploads a PDF or DOCX résumé (max 5 MB), stores it on disk, extracts readable text, and " +
        "creates the initial résumé + résumé-analysis records.",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["resume"],
              properties: {
                resume: {
                  type: "string",
                  format: "binary",
                  description: "PDF or DOCX résumé file (maximum 5 MB).",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Résumé uploaded and text extracted successfully.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResumeUploadResponse" } } },
        },
        "400": {
          description: "Missing file, unsupported file type (only PDF/DOCX allowed), or file too large.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "422": {
          description: "The file uploaded successfully, but text extraction failed.",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ErrorResponse" },
                  { type: "object", properties: { resumeId: { type: "integer", nullable: true } } },
                ],
              },
            },
          },
        },
      },
    },
  },

  "/api/resumes/{resumeId}/analyze": {
    post: {
      tags: ["Resumes"],
      summary: "Analyze a résumé with AI",
      description:
        "Sends the previously extracted résumé text to AI, then saves the professional summary, skills, " +
        "employment history, and education (replacing any previous results), and returns the structured analysis.",
      security: bearerSecurity,
      parameters: [resumeIdParam],
      responses: {
        "200": {
          description: "Résumé analyzed successfully.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  resumeId: { type: "integer" },
                  analysis: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "COMPLETED" },
                      professionalSummary: { type: "string" },
                      skills: { type: "array", items: { $ref: "#/components/schemas/Skill" } },
                      employmentHistory: {
                        type: "array",
                        items: { $ref: "#/components/schemas/EmploymentHistoryEntry" },
                      },
                      education: { type: "array", items: { $ref: "#/components/schemas/EducationEntry" } },
                    },
                  },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "409": {
          description: "Résumé text has not been extracted yet (upload step incomplete).",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/api/resumes/{resumeId}/analysis": {
    get: {
      tags: ["Resumes"],
      summary: "Get saved résumé analysis",
      description:
        "Returns the previously saved résumé analysis (professional summary, skills, employment history, " +
        "education). Does not call AI.",
      security: bearerSecurity,
      parameters: [resumeIdParam],
      responses: {
        "200": {
          description: "Structured résumé analysis returned successfully.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResumeAnalysisResponse" } } },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/api/resumes/{resumeId}/raw-text": {
    get: {
      tags: ["Resumes"],
      summary: "Get extracted résumé text",
      description:
        "Returns the raw text extracted from the uploaded PDF/DOCX résumé. Intended for debugging and " +
        "administrative purposes.",
      security: bearerSecurity,
      parameters: [resumeIdParam],
      responses: {
        "200": {
          description: "Raw résumé text returned successfully.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/RawTextResponse" } } },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  // ===== RECOMMENDATIONS ================================================================
  "/api/resumes/{resumeId}/recommendations": {
    post: {
      tags: ["Recommendations"],
      summary: "Generate career recommendations",
      description:
        "Uses the saved résumé analysis, AI, and the career catalog to generate ranked career " +
        "recommendations. Replaces any previously generated recommendations for this résumé.",
      security: bearerSecurity,
      parameters: [resumeIdParam],
      responses: {
        "201": {
          description: "Career recommendations generated successfully.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RecommendationGenerateResponse" } },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "409": {
          description:
            "Résumé analysis incomplete, no résumé skills available, or the career catalog has not been loaded.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    get: {
      tags: ["Recommendations"],
      summary: "Get saved career recommendations",
      description: "Returns the previously generated career recommendations from the database. Does not call AI.",
      security: bearerSecurity,
      parameters: [resumeIdParam],
      responses: {
        "200": {
          description: "Career recommendations returned successfully.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RecommendationListResponse" } },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/api/resumes/{resumeId}/recommendations/{recommendationId}/select": {
    patch: {
      tags: ["Recommendations"],
      summary: "Select a career recommendation",
      description:
        "Marks one previously generated recommendation as the user's selected career path. Clears the " +
        "`selected` flag on any other recommendation for the same résumé.",
      security: bearerSecurity,
      parameters: [
        resumeIdParam,
        {
          name: "recommendationId",
          in: "path",
          required: true,
          schema: { type: "integer" },
          example: 55,
          description: "The ID of the recommendation to select.",
        },
      ],
      responses: {
        "200": {
          description: "Career selected successfully.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RecommendationSelectResponse" } },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": {
          description: "Résumé not found, or the recommendation does not belong to this résumé.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  // ===== RESUME OPTIMIZATION ================================================================
  "/api/resumes/{resumeId}/optimization": {
    post: {
      tags: ["Optimization"],
      summary: "Generate résumé optimization",
      description:
        "Generates AI-driven keyword and improvement suggestions comparing the résumé to the user's " +
        "selected career recommendation. Requires that the résumé has been analyzed and a recommendation " +
        "has been selected. Replaces any previously generated optimization for this résumé/career pairing.",
      security: bearerSecurity,
      parameters: [resumeIdParam],
      responses: {
        "201": {
          description: "Résumé optimization generated successfully.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResumeOptimizationGenerateResponse" },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "409": {
          description:
            "The résumé has not been analyzed yet, or no career recommendation has been selected.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    get: {
      tags: ["Optimization"],
      summary: "Get saved résumé optimization",
      description:
        "Returns the previously generated résumé optimization (matched/missing keywords, suggested " +
        "actions) for the résumé's currently selected career. Does not call AI.",
      security: bearerSecurity,
      parameters: [resumeIdParam],
      responses: {
        "200": {
          description: "Résumé optimization returned successfully.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ResumeOptimizationGetResponse" } },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": {
          description:
            "Résumé not found, no career recommendation is selected, or optimization has not been generated yet.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  // ===== READINESS REPORT ================================================================
  "/api/resumes/{resumeId}/readiness-report": {
    post: {
      tags: ["Readiness Report"],
      summary: "Generate a career readiness report",
      description:
        "Builds (or rebuilds) a readiness report — score, milestones, and a personalized action list — " +
        "from the résumé's selected career recommendation and its most recent optimization results.",
      security: bearerSecurity,
      parameters: [resumeIdParam],
      responses: {
        "201": {
          description: "Readiness report generated successfully.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ReadinessReportGenerateResponse" } },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "409": {
          description:
            "No career recommendation is selected, or résumé optimization has not been completed yet.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    get: {
      tags: ["Readiness Report"],
      summary: "Get the saved readiness report",
      description: "Returns the previously generated readiness report for the résumé's selected career.",
      security: bearerSecurity,
      parameters: [resumeIdParam],
      responses: {
        "200": {
          description: "Readiness report returned successfully.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ReadinessReportGetResponse" } },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": {
          description:
            "Résumé not found, no career recommendation is selected, résumé optimization has not been " +
            "generated, or the readiness report has not been generated yet.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  // ===== CAREERS ================================================================
  "/api/careers": {
    get: {
      tags: ["Careers"],
      summary: "List career roles",
      description:
        "Returns career roles from the local O*NET-backed career catalog. Results can be filtered with " +
        "`search`, which matches against title, description, O*NET-SOC code, or BLS occupation code.",
      security: bearerSecurity,
      parameters: [
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          example: "software",
          description: "Free-text search across title, description, and occupation codes.",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          example: 20,
          description: "Maximum number of results to return (capped at 50).",
        },
      ],
      responses: {
        "200": {
          description: "Career catalog returned successfully.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/CareerListResponse" } } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/api/careers/{careerRoleId}": {
    get: {
      tags: ["Careers"],
      summary: "Get career details",
      description:
        "Returns one career role. If a BLS occupation code has not yet been derived, the backend derives " +
        "and saves it from the O*NET-SOC code. If salary data is missing or older than the cache window " +
        "(365 days), the backend refreshes it from the BLS API before responding; if that call fails, any " +
        "existing stale data is still returned along with the error.",
      security: bearerSecurity,
      parameters: [
        {
          name: "careerRoleId",
          in: "path",
          required: true,
          schema: { type: "integer" },
          example: 123,
        },
      ],
      responses: {
        "200": {
          description: "Career returned successfully.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/CareerDetailResponse" } } },
        },
        "400": {
          description: "Invalid career role ID.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": {
          description: "Career role not found.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// DOCUMENT
// ---------------------------------------------------------------------------

const openApiDocument = {
  openapi: "3.1.0",

  info: {
    title: "The Per Scholian Backend API",
    version: "1.0.0",
    description:
      "REST API for The Per Scholian career development platform: résumé upload/AI analysis, " +
      "career-catalog browsing with live BLS wage data, AI-generated career recommendations, " +
      "résumé optimization, and career-readiness reporting.\n\n" +
      "Every endpoint except `/`, `/auth/*`, and `/api-docs` requires a `Bearer` JWT, obtained via " +
      "`/auth/register`, `/auth/login`, or the GitHub OAuth flow.",
    contact: {
      name: "The Per Scholian",
    },
  },

  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],

  tags: [
    { name: "Authentication", description: "Registration, login, and GitHub OAuth." },
    { name: "Users", description: "User profile and dashboard." },
    { name: "Roadmaps", description: "Career roadmap endpoints." },
    { name: "Resumes", description: "Résumé upload, text extraction, and AI analysis." },
    { name: "Recommendations", description: "AI-generated career recommendations." },
    { name: "Optimization", description: "AI-generated résumé optimization for a selected career." },
    { name: "Readiness Report", description: "Career-readiness scoring, milestones, and action items." },
    { name: "Careers", description: "O*NET/BLS-backed career catalog." },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT returned by `/auth/register`, `/auth/login`, or the GitHub OAuth callback.",
      },
    },
    schemas,
    responses,
  },

  paths,

  security: [{ bearerAuth: [] }],
};

module.exports = openApiDocument;
