const BASE = "http://localhost:3000";

// ---- auth ----
export async function login(email, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`Login failed: ${r.status}`);
  const data = await r.json();
  sessionStorage.setItem("token", data.token);
  return data.user;
}

function authHeader() {
  return { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
}

// ---- resumes ----
export async function uploadResume(file, github) {
  const form = new FormData();
  form.append("resume", file); // field name must match Keoki's multer config
  if (github) form.append("github", github); // TODO: verify field name in Swagger
  const r = await fetch(`${BASE}/api/resumes/upload`, {
    method: "POST",
    headers: authHeader(),
    body: form,
  });
  if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
  return r.json();
}
export async function analyzeResume(id) {
  const r = await fetch(`${BASE}/api/resumes/${id}/analyze`, {
    method: "POST",
    headers: authHeader(),
  });
  if (!r.ok) throw new Error(`Analyze failed: ${r.status}`);
  return r.json();
}

export async function getResumeStatus(id) {
  const r = await fetch(`${BASE}/api/resumes/${id}/analysis`, {
    headers: authHeader(),
  });
  if (!r.ok) throw new Error(`Status failed: ${r.status}`);
  return r.json();
}

export async function getResumeAnalysis(id) {
  const r = await fetch(`${BASE}/api/resumes/${id}/analysis`, {
    headers: authHeader(),
  });
  if (!r.ok) throw new Error(`Analysis failed: ${r.status}`);
  return r.json();
}

// ---- careers ----
export async function getCareerRecommendations(resumeId) {
  const r = await fetch(`${BASE}/api/resumes/${resumeId}/recommendations`, {
    method: "POST",
    headers: authHeader(),
  });
  if (!r.ok) throw new Error(`Recommendations failed: ${r.status}`);
  const data = await r.json();
  return data.recommendations.map((rec) => ({
    lucideIcon: rec.career.lucideIcon,
    Title: rec.career.title,
    Description: rec.career.description,
    averageSalary:
      rec.career.salary?.minimum != null && rec.career.salary?.maximum != null
        ? Math.round((rec.career.salary.minimum + rec.career.salary.maximum) / 2)
        : null,
    matchScore: rec.matchScore,
    rank: rec.rank,
  }));
}