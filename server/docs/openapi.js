const openApiDocument = {
    openapi: "3.1.0",

    info: {
        title: "The Per Scholian Backend API",
        version: "1.0.0",
        description:
            "REST API for The Per Scholian career development platform.",
    },

    servers: [
        {
            url: "http://localhost:3000",
            description: "Local Development Server",
        },
    ],

    tags: [
        {
            name: "Authentication",
            description: "Registration, login and GitHub OAuth",
        },
        {
            name: "Users",
            description: "User profile and dashboard",
        },
        {
            name: "Roadmaps",
            description: "Career roadmap endpoints",
        },
        {
            name: "Resumes",
            description: "Resume upload and AI analysis",
        },
        {
            name: "Careers",
            description: "Career catalog",
        },
        {
            name: "Recommendations",
            description: "Career recommendations",
        },
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },

        schemas: {}
    },

    paths: {

        "/auth/register": {
            post: {
                tags: ["Authentication"],
                summary: "Register a new user",
                description:
                    "Creates a new local user account and returns a JWT.",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "email", "password"],
                                properties: {
                                    username: {
                                        type: "string",
                                        example: "keoki"
                                    },
                                    email: {
                                        type: "string",
                                        example: "keoki@example.com"
                                    },
                                    password: {
                                        type: "string",
                                        example: "Password123!"
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    "201": {
                        description: "Registration successful"
                    },
                    "400": {
                        description: "Missing required fields"
                    },
                    "500": {
                        description: "Registration failed"
                    }
                }
            }
        },

        "/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "Login",

                description:
                    "Authenticate using username or email and receive a JWT.",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    username: {
                                        type: "string",
                                        example: "keoki"
                                    },
                                    email: {
                                        type: "string",
                                        example: "keoki@example.com"
                                    },
                                    password: {
                                        type: "string",
                                        example: "Password123!"
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    "200": {
                        description: "Login successful"
                    },
                    "401": {
                        description: "Invalid credentials"
                    },
                    "500": {
                        description: "Login failed"
                    }
                }
            }
        },

        "/auth/github": {
            get: {
                tags: ["Authentication"],
                summary: "Begin GitHub OAuth",

                description:
                    "Redirects the user to GitHub for authentication.",

                responses: {
                    "302": {
                        description: "Redirect to GitHub"
                    }
                }
            }
        },

        "/auth/github/callback": {
            get: {
                tags: ["Authentication"],
                summary: "GitHub OAuth callback",

                description:
                    "GitHub redirects here after authentication. The backend redirects to the frontend with the JWT in the query string.",

                responses: {
                    "302": {
                        description: "Redirect to frontend"
                    },
                    "401": {
                        description: "Authentication failed"
                    }
                }
            }
        },

        "/auth/failure": {
            get: {
                tags: ["Authentication"],
                summary: "GitHub authentication failure",

                responses: {
                    "401": {
                        description: "Authentication failed"
                    }
                }
            }
        },

        "/api/users/profile": {
            get: {
                tags: ["Users"],
                summary: "Get the authenticated user's profile",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {
                    "200": {
                        description: "Authenticated user profile"
                    },
                    "401": {
                        description: "Authentication required"
                    }
                }
            }
        },

        "/api/users/dashboard": {
            get: {
                tags: ["Users"],
                summary: "Get dashboard data",

                description:
                    "Returns dashboard information for the authenticated user.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {
                    "200": {
                        description: "Dashboard data returned successfully"
                    },
                    "401": {
                        description: "Authentication required"
                    }
                }
            }
        }

        ,

        "/api/roadmaps/demo": {
            get: {
                tags: ["Roadmaps"],

                summary: "Get demo career roadmap",

                description:
                    "Returns a sample career roadmap for the authenticated user.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {
                    "200": {
                        description: "Demo roadmap returned successfully"
                    },
                    "401": {
                        description: "Authentication required"
                    }
                }
            }
        }

        ,

        "/api/resumes/upload": {
            post: {
                tags: ["Resumes"],

                summary: "Upload a résumé",

                description:
                    "Uploads a PDF or DOCX résumé, stores it, extracts readable text, and creates the initial résumé analysis record.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

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
                                        description: "PDF or DOCX résumé (maximum 5 MB)"
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {

                    "201": {
                        description: "Résumé uploaded successfully"
                    },

                    "400": {
                        description:
                            "Missing file, unsupported file type, or file too large"
                    },

                    "401": {
                        description: "Authentication required"
                    },

                    "422": {
                        description:
                            "Résumé uploaded but text extraction failed"
                    }

                }
            }
        },

        "/api/resumes/{resumeId}/analyze": {
            post: {
                tags: ["Resumes"],

                summary: "Analyze a résumé with AI",

                description:
                    "Reads the previously extracted résumé text, sends it to AI, saves the professional summary, skills, employment history, and education, then returns the structured analysis.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    {
                        name: "resumeId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "integer"
                        },
                        example: 1
                    }
                ],

                responses: {

                    "200": {
                        description: "Résumé analyzed successfully"
                    },

                    "400": {
                        description: "Invalid résumé ID"
                    },

                    "401": {
                        description: "Authentication required"
                    },

                    "404": {
                        description: "Résumé not found"
                    },

                    "409": {
                        description:
                            "Résumé text has not yet been extracted"
                    },

                    "500": {
                        description:
                            "AI analysis failed"
                    }

                }
            }
        }

        ,

        "/api/resumes/{resumeId}/analysis": {
            get: {
                tags: ["Resumes"],

                summary: "Get saved résumé analysis",

                description:
                    "Returns the previously saved résumé analysis, including the professional summary, extracted skills, employment history, and education. This endpoint does not call AI.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    {
                        name: "resumeId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "integer"
                        },
                        example: 1
                    }
                ],

                responses: {

                    "200": {
                        description: "Structured résumé analysis returned successfully"
                    },

                    "400": {
                        description: "Invalid résumé ID"
                    },

                    "401": {
                        description: "Authentication required"
                    },

                    "404": {
                        description: "Résumé not found"
                    },

                    "500": {
                        description: "Unable to retrieve résumé analysis"
                    }

                }
            }
        }

        ,

        "/api/resumes/{resumeId}/raw-text": {
            get: {
                tags: ["Resumes"],

                summary: "Get extracted résumé text",

                description:
                    "Returns the raw text extracted from the uploaded PDF or DOCX résumé. This endpoint is primarily intended for debugging and administrative purposes.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    {
                        name: "resumeId",
                        in: "path",
                        required: true,

                        schema: {
                            type: "integer"
                        },

                        example: 1
                    }
                ],

                responses: {

                    "200": {
                        description: "Raw résumé text returned successfully"
                    },

                    "400": {
                        description: "Invalid résumé ID"
                    },

                    "401": {
                        description: "Authentication required"
                    },

                    "404": {
                        description: "Résumé not found"
                    },

                    "500": {
                        description: "Unable to retrieve raw résumé text"
                    }

                }
            }
        }
        ,


        "/api/resumes/{resumeId}/recommendations": {

            post: {

                tags: ["Recommendations"],

                summary: "Generate career recommendations",

                description:
                    "Uses the saved résumé analysis, AI, and the career catalog to generate ranked career recommendations. The generated recommendations are stored in the database.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    {
                        name: "resumeId",
                        in: "path",
                        required: true,

                        schema: {
                            type: "integer"
                        },

                        example: 1
                    }
                ],

                responses: {

                    "201": {
                        description:
                            "Career recommendations generated successfully"
                    },

                    "400": {
                        description:
                            "Invalid résumé ID"
                    },

                    "401": {
                        description:
                            "Authentication required"
                    },

                    "404": {
                        description:
                            "Résumé not found"
                    },

                    "409": {
                        description:
                            "Résumé analysis incomplete, no résumé skills available, or the career catalog has not been loaded"
                    },

                    "500": {
                        description:
                            "Unable to generate career recommendations"
                    }

                }

            },

            get: {

                tags: ["Recommendations"],

                summary: "Get saved career recommendations",

                description:
                    "Returns the previously generated career recommendations from the database. This endpoint does not call AI.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    {
                        name: "resumeId",
                        in: "path",
                        required: true,

                        schema: {
                            type: "integer"
                        },

                        example: 1
                    }
                ],

                responses: {

                    "200": {
                        description:
                            "Career recommendations returned successfully"
                    },

                    "400": {
                        description:
                            "Invalid résumé ID"
                    },

                    "401": {
                        description:
                            "Authentication required"
                    },

                    "404": {
                        description:
                            "Résumé not found"
                    },

                    "500": {
                        description:
                            "Unable to retrieve career recommendations"
                    }

                }
            }

        },

        "/api/careers": {

            get: {

                tags: ["Careers"],

                summary: "List career roles",

                description:
                    "Returns career roles from the local O*NET career catalog. Results may be filtered using the search parameter.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [

                    {
                        name: "search",
                        in: "query",
                        required: false,

                        schema: {
                            type: "string"
                        },

                        example: "software"
                    },

                    {
                        name: "limit",
                        in: "query",
                        required: false,

                        schema: {
                            type: "integer",
                            minimum: 1,
                            maximum: 50
                        },

                        example: 20
                    }

                ],

                responses: {

                    "200": {
                        description:
                            "Career catalog returned successfully"
                    },

                    "401": {
                        description:
                            "Authentication required"
                    },

                    "500": {
                        description:
                            "Unable to retrieve careers"
                    }

                }

            }

        },

        "/api/careers/{careerRoleId}": {

            get: {

                tags: ["Careers"],

                summary: "Get career details",

                description:
                    "Returns one career role. If salary data is missing or stale, the backend may retrieve the latest BLS wage information before responding.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [

                    {
                        name: "careerRoleId",
                        in: "path",
                        required: true,

                        schema: {
                            type: "integer"
                        },

                        example: 123
                    }

                ],

                responses: {

                    "200": {
                        description:
                            "Career returned successfully"
                    },

                    "400": {
                        description:
                            "Invalid career role ID"
                    },

                    "401": {
                        description:
                            "Authentication required"
                    },

                    "404": {
                        description:
                            "Career role not found"
                    },

                    "500": {
                        description:
                            "Unable to retrieve career"
                    }

                }

            }

        }

    }
};

openApiDocument.security = [
    {
        bearerAuth: []
    }
];

module.exports = openApiDocument;