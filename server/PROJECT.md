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

## Current Backend Structure

The exact folder structure should be confirmed against the repository before making changes.

The project currently includes or is expected to include folders similar to:

```text
backend/
├── config/
├── controllers/
├── middleware/
├── prisma/
├── routes/
├── services/
├── utils/
├── uploads/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── PROJECT.md
├── SESSION.md
└── server.js
```

Do not assume every folder listed above currently exists.

Always inspect the actual repository before creating or moving files.

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

## Current Broad Status

Likely completed or substantially implemented:

* Express backend setup
* Prisma setup
* SQLite database
* User-related routes
* Roadmap-related routes
* Passport.js configuration
* GitHub OAuth configuration
* JWT generation
* Career role data
* Career recommendation logic
* O*NET data integration
* BLS salary or employment data integration
* BLS availability metadata

Needs confirmation in the current repository:

* Exact authentication flow
* Exact recommendation routes
* Exact resume upload implementation
* Resume text extraction
* AI resume analysis
* Editable skills
* Editable employment history
* Editable education history
* Frontend integration
* Automated tests
* Deployment configuration

---

## Current Development Priority

The current priority is to finish and verify career recommendation responses, especially BLS-related fields.

The expected work includes:

* Returning BLS status in each recommendation response.
* Selecting all required BLS fields in Prisma queries.
* Keeping recommendation response formats consistent.
* Testing recommendation routes.
* Confirming routes still work when BLS data is missing.
* Creating logical Git commits after successful testing.

The exact route files and endpoint paths must be confirmed from the repository.

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
