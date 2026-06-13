const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("crowdfaq_token");
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "API request failed");
  }

  return data;
}

export async function fetchFaqs() {
  return request("/faqs");
}

export async function fetchQueries() {
  return request("/queries");
}

export async function searchFaq({ keyword, category = "All Categories", limit = 20 }) {
  return request("/search", {
    method: "POST",
    body: JSON.stringify({
      keyword,
      category,
      limit
    })
  });
}

export async function fetchCategories() {
  return request("/faqs/meta/categories");
}

export async function submitQuery(payload) {
  return request("/queries", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createFaq(payload) {
  return request("/faqs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function submitAnswer(payload) {
  return request("/answers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchAnswers(questionId) {
  return request(`/answers/${questionId}`);
}

export async function toggleVote(payload) {
  return request("/votes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function toggleBookmarkApi(payload) {
  return request("/bookmarks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchBookmarks(userId = "anonymous") {
  return request(`/bookmarks/${userId}`);
}

export async function fetchActivityStats(range = "week") {
  return request(`/stats/activity?range=${range}`);
}

export async function fetchHeatmapStats(range = "week") {
  return request(`/stats/heatmap?range=${range}`);
}

export async function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function loginUser(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchLeaderboard() {
  return request("/users/leaderboard");
}

export async function fetchMe() {
  return request("/users/me");
}

export async function generateSummaryApi(payload) {
  return request("/summary", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function checkDuplicates(payload) {
  return request("/duplicates", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createPeerAnswer(payload) {
  return request("/peer-answers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchPeerAnswers(faqId) {
  return request(`/peer-answers/${faqId}`);
}

export async function fetchRecommendations(limit = 10) {
  return request(`/recommendations?limit=${limit}`);
}
