# The Per Scholian

## Project Overview

The Per Scholian is an AI-assisted career development platform being built for the Per Scholas community.

The application is intended to help aspiring learners, current learners, and alumni understand their current career readiness, identify suitable career paths, recognize skill gaps, and build practical career roadmaps.

The backend is currently the primary development focus.

---

## Core Product Goals

The application should eventually allow users to:

* Create and manage a user profile.
* Upload a resume.
* Extract structured information from the resume.
* Review and edit extracted skills.
* Review and edit employment history.
* Review and edit education history.
* Receive career recommendations.
* Compare current skills with target career requirements.
* View salary and employment projection information.
* Build a personalized career roadmap.
* Track milestones and progress.
* Receive AI-assisted career guidance.
* Prepare for interviews and job applications.
* Improve portfolio and GitHub presentation.

---

## Current Technology Stack

### Backend

* Node.js
* Express
* JavaScript
* Prisma ORM
* SQLite
* REST API

### Authentication

* Passport.js
* GitHub OAuth
* JSON Web Tokens

### Development Tools

* Nodemon
* Postman or another API testing client
* Git
* GitHub

### External Data Sources

* O*NET occupation data
* Bureau of Labor Statistics wage data
* Bureau of Labor Statistics employment projection data

---

## Repository Source of Truth

When assisting with this project, inspect these files in this order:

1. PROJECT.md
2. SESSION.md
3. package.json
4. server.js
5. prisma/schema.prisma
6. prisma.config.ts
7. Relevant route files
8. Relevant service files

Repository code always takes precedence over documentation.

---

## Database

Prisma is used to access a SQLite database.

The current Prisma schema should be treated as the source of truth for database models and field names.

Known or planned models include:

* User
* Resume
* ResumeAnalysis
* Skill
* EmploymentHistory
* Education
* CareerRole
* Roadmap
* Milestone

Some of these models may still be incomplete or may not yet exist in the current branch.

Do not add or rename models without reviewing `prisma/schema.prisma`.

---

## Known User Profile Fields

The User model may include fields such as:

* id
* githubId
* username
* email
* password
* displayName
* avatarUrl
* stage
* careerGoal
* createdAt
* updatedAt

The current Prisma schema must be checked before relying on these names.

---

## Resume Processing Design

The intended resume workflow is:

1. The user uploads a PDF or DOCX resume.
2. The backend stores file metadata.
3. A Resume record is created.
4. Resume processing status begins as pending or processing.
5. Text is extracted from the file.
6. Resume analysis is performed.
7. Skills, employment history, and education are extracted.
8. Extracted information is shown to the user.
9. The user can confirm, edit, or delete extracted information.

Possible resume status values include:

* PENDING
* PROCESSING
* COMPLETED
* FAILED

The actual enum values in `prisma/schema.prisma` should always be verified.

---

## Career Recommendation Design

Career recommendations are based on career role information, user information, skills, and external occupational data.

Career recommendation responses may include:

* Career role ID
* O*NET SOC code
* BLS occupation code
* Career title
* Career description
* Icon name
* Target score
* Salary range
* Employment growth percentage
* Job outlook
* Source information
* Source update timestamp
* BLS lookup status

The response structure should remain consistent across recommendation routes whenever possible.

---

## Career Response Shape

The current recommendation API has recently been returning career information similar to:

```json
{
  "id": 116,
  "onetSocCode": "15-1241.00",
  "blsOccupationCode": "151241",
  "title": "Computer Network Architects",
  "description": "Occupation description",
  "lucideIcon": "Network",
  "salary": {
    "minimum": 79900,
    "maximum": 202680,
    "source": "BLS OEWS",
    "updatedAt": "2026-07-12T03:38:31.274Z"
  },
  "bls": {
    "occupationCodeAvailable": true,
    "salaryAvailable": true,
    "employmentProjectionAvailable": true,
    "lookupAttempted": false,
    "lookupAttemptedAt": null,
    "lookupError": null
  },
  "employmentGrowthPercent": 11.9,
  "jobOutlook": "Much Faster than Average",
  "targetScore": 70,
  "sources": {
    "occupation": "ONET",
    "wages": "BLS OEWS"
  },
  "sourceUpdatedAt": "2026-07-12T03:38:31.274Z"
}
```

This example documents the desired response shape.

It does not replace the current route implementation.

---

## BLS Data Design

CareerRole records may contain fields such as:

* blsOccupationCode
* salaryMin
* salaryMax
* salarySource
* salaryUpdatedAt
* employmentGrowthPercent
* employmentProjectionUpdatedAt
* blsLookupAttempted
* blsLookupAttemptedAt
* blsLookupError

The exact field names must be confirmed in `prisma/schema.prisma`.

A recommendation should still be returned when some or all BLS information is unavailable.

Missing BLS information should not cause the full recommendation route to fail.

---

## BLS Response Metadata

Recommendation career objects should include a BLS status object similar to:

```js
bls: {
  occupationCodeAvailable:
    Boolean(recommendation.careerRole.blsOccupationCode),

  salaryAvailable:
    recommendation.careerRole.salaryMin !== null &&
    recommendation.careerRole.salaryMax !== null,

  employmentProjectionAvailable:
    recommendation.careerRole.employmentGrowthPercent !== null,

  lookupAttempted:
    recommendation.careerRole.blsLookupAttempted,

  lookupAttemptedAt:
    recommendation.careerRole.blsLookupAttemptedAt,

  lookupError:
    recommendation.careerRole.blsLookupError,
}
```

The Prisma query must select every field used when constructing this response.

For example:

```js
blsOccupationCode: true,
salaryMin: true,
salaryMax: true,
employmentGrowthPercent: true,
blsLookupAttempted: true,
blsLookupAttemptedAt: true,
blsLookupError: true,
```

Additional salary source and update fields may also be required depending on the current response formatter.

---

## External Data Responsibilities

### O*NET

O*NET is used as the primary occupation source.

It may provide:

* Occupation titles
* Occupation descriptions
* O*NET SOC codes
* Skills
* Knowledge areas
* Abilities
* Tasks
* Work activities

### Bureau of Labor Statistics

BLS supplements occupation data with:

* Wage information
* Salary ranges
* Employment projection information
* Employment growth percentages
* Job outlook classifications

O*NET and BLS occupation codes may require normalization or mapping.

Do not assume every O*NET occupation has a direct BLS match.

---

## API Routes

The current Express route registration has included routes similar to:

```js
router.use("/auth", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/roadmaps", roadmapRoutes);
```

Additional recommendation, career, resume, and profile routes may exist.

Before documenting or testing an endpoint, inspect:

* `server.js`
* `routes/index.js`
* every file inside `routes/`

Do not invent route paths.

---

## API Response Rules

When modifying an existing route:

* Preserve its current response shape unless a change is explicitly required.
* Avoid changing unrelated fields.
* Return valid JSON.
* Use appropriate HTTP status codes.
* Include useful error messages.
* Do not expose stack traces in production responses.
* Do not allow missing optional external data to crash the route.
* Keep recommendation career objects consistent across endpoints.

Do not impose a new global response wrapper unless the application already uses one.

---

## Coding Standards

Use these standards when assisting with the project:

* Use `async` and `await` for asynchronous operations.
* Use `try` and `catch` around route logic that may fail.
* Use descriptive variable names.
* Validate required input.
* Prefer Prisma over raw SQL.
* Avoid duplicated response-building logic.
* Reuse helper functions when the same object is formatted in multiple routes.
* Preserve existing naming conventions.
* Preserve existing module syntax.
* Do not convert CommonJS to ES modules, or ES modules to CommonJS, unless requested.
* Do not rewrite an entire architecture to solve a small route issue.
* Avoid unrelated cleanup while fixing a focused problem.
* Use nullable values instead of fake values such as `0`, `"Unknown"`, or empty strings when data is genuinely unavailable.
* Explain migrations before applying destructive database changes.
* Never assume a database field exists without checking the Prisma schema.

---

## Instructions for AI Coding Assistance

When assisting with this project:

1. Read `PROJECT.md`.
2. Read `SESSION.md`.
3. Inspect the actual files relevant to the current task.
4. Treat current repository files as more authoritative than this document.
5. Identify any conflict between documentation and code.
6. Do not guess missing field names, endpoints, models, or imports.
7. Ask for or inspect the relevant file when information is unavailable.
8. When requested, provide the complete corrected file rather than fragments.
9. Clearly identify every file that must change.
10. Provide step-by-step testing instructions.
11. Include expected success responses.
12. Include expected failure responses.
13. Suggest small logical Git commits after the code is tested.
14. Do not claim a route is working unless its implementation or test result has been reviewed.

---

## Preferred Development Workflow

For each feature:

1. State the immediate goal.
2. Identify the files involved.
3. Inspect current code.
4. Describe the required change.
5. Update one logical area at a time.
6. Start the backend.
7. Test the route.
8. Check the database when relevant.
9. Run existing automated tests when available.
10. Review the response shape.
11. Commit the completed change.
12. Update `SESSION.md`.

---

## Testing Expectations

Every backend route change should include:

* The HTTP method.
* The full route path.
* Required authentication.
* Required headers.
* Request body or query parameters.
* Example success response.
* Example validation failure.
* Example not-found response when relevant.
* Example server or external-service failure when relevant.
* Instructions for confirming database changes.
* Instructions for checking server logs.

Postman, Thunder Client, curl, or another HTTP client may be used.

---

## Git Commit Guidelines

Prefer small commits that represent one completed behavior.

Examples:

```bash
git add routes/recommendations.js
git commit -m "Return BLS status in recommendation responses"
```

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "Add BLS lookup tracking fields"
```

```bash
git add PROJECT.md SESSION.md
git commit -m "Add project development documentation"
```

Do not commit:

* `.env`
* SQLite development database files
* uploaded resume files
* API secrets
* access tokens
* generated temporary files

---

## Environment Variables

The project may require environment variables for:

* Server port
* JWT secret
* GitHub OAuth client ID
* GitHub OAuth client secret
* GitHub OAuth callback URL
* O*NET credentials
* BLS API key
* Frontend URL
* Database configuration

The actual variable names should be copied from `.env.example`.

Never place real credentials in this document.

---

## Documentation Maintenance

Update this file only when stable project information changes.

Examples:

* Technology stack changes
* New major models
* New external services
* Major architecture changes
* Stable API conventions
* New permanent development rules

Use `SESSION.md` for day-to-day progress and unfinished work.

## AI Design Philosophy

Artificial intelligence is used to interpret, reason about, and personalize career guidance.

AI should **not** be the primary source of factual occupational information when trusted structured data already exists.

Whenever possible, career information should come from authoritative external sources such as:

- O*NET
- Bureau of Labor Statistics (BLS)
- Per Scholas data
- User-provided information

AI is primarily responsible for:

- Resume interpretation
- Career matching
- Skill-gap analysis
- Resume optimization
- Recommendation ranking
- Personalized explanations
- Career coaching

AI should avoid inventing factual occupational data that is available from trusted sources.

## External Data Priority

Whenever multiple sources are available, use the following priority:

1. Cached application database
2. Bureau of Labor Statistics (BLS)
3. O*NET
4. AI reasoning

Examples:

- Salary should come from BLS whenever possible.
- Occupation descriptions should come from O*NET.
- AI should explain or interpret the data rather than replacing it.

## Backend Responsibilities

The backend is responsible for:

- Authentication
- AI communication
- Resume parsing
- Career recommendation generation
- External API integration
- Data persistence
- Business rules
- Response formatting
- Caching external data

The frontend should not communicate directly with:

- Gemini
- O*NET
- Bureau of Labor Statistics

The frontend should communicate only with backend REST endpoints.

## Career Recommendation Pipeline

The intended recommendation pipeline is:

Upload Resume

↓

Extract Resume Text

↓

Analyze Resume with AI

↓

Store Structured Resume Data

↓

Load Career Catalog

↓

Select Candidate Careers

↓

AI Determines Best Career Matches

↓

Store Career Recommendations

↓

Display Recommended Careers

↓

User Selects Career

↓

Generate Resume Optimization

↓

Generate Readiness Report

↓

Build Personalized Roadmap

## Current Core Database Models

The application currently revolves around the following primary models.

Always verify the Prisma schema before assuming field names.

Core models include:

- User
- Resume
- ResumeAnalysis
- Skill
- EmploymentHistory
- Education
- CareerRole
- RoleRecommendation
- ResumeOptimization
- ReadinessReport
- Roadmap
- Milestone

## External Data Cache Strategy

External API requests should be minimized whenever practical.

Current strategy:

- Store retrieved BLS data inside CareerRole.
- Reuse cached values whenever they remain fresh.
- Refresh stale data automatically.
- Do not repeatedly call external services for identical information.

Current cache policy:

- BLS salary data: approximately 30 days

When cache expires:

1. Request updated data.
2. Update CareerRole.
3. Return refreshed information to the client.

The application should continue functioning even when external services are temporarily unavailable.

## Primary User Workflow

The intended user experience is:

Register or Login

↓

Upload Resume

↓

Analyze Resume

↓

Review Extracted Information

↓

Generate Career Recommendations

↓

Review Recommended Careers

↓

Select Target Career

↓

Optimize Resume

↓

Review Readiness Report

↓

Follow Personalized Career Roadmap

## Current Backend Structure

The backend currently has the following structure:

```text
backend/
├── config/
├── data/
├── prisma/
├── routes/
├── scripts/
├── services/
├── uploads/
├── utils/
├── .env
├── .env.example
├── package.json
├── prisma.config.ts
├── PROJECT.md
└── server.js
```

Notes:

- `config/` contains application configuration.
- `data/` contains application data files and datasets.
- `prisma/` contains the Prisma schema and migrations.
- `routes/` contains Express route definitions.
- `scripts/` contains import and maintenance scripts.
- `services/` contains business logic and external API integrations.
- `uploads/` stores uploaded résumé files.
- `utils/` contains shared helper functions.

Future folders may be added as the project grows, but existing folders should not be renamed or reorganized without a specific reason.

## Important Configuration Files

The following files are considered core project configuration and should be inspected before making architectural changes:

```text
package.json
server.js
prisma/schema.prisma
prisma.config.ts
.env.example
PROJECT.md
SESSION.md
```

These files should be treated as authoritative before creating new configuration.


## AI Assistant Guidelines

When assisting with this project:

- Read PROJECT.md.
- Read SESSION.md.
- Inspect the relevant repository files before suggesting changes.
- Treat the repository as the source of truth.
- Preserve existing comments unless requested otherwise.
- Prefer complete corrected files when requested.
- Suggest small, logical Git commits.
- Explain testing steps before considering work complete.
- Create reminders to update PROJECT.md and SESSION.md files.
- Suggest updates to this document when necessary.
- Suggest updates to Open API 3.1 document.
- Remind me when I should be in the /server folder and not. Make it very clear so I don't overlook it.