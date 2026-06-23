const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}, attempt = 0) {
  const token = localStorage.getItem("crowdfaq-token");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const err = new Error(payload.message || payload.error || `Request failed: ${response.status}`);
      if (payload.code) err.code = payload.code;
      throw err;
    }

    return payload;
  } catch (error) {
    const retryable =
      error.name === "AbortError" ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError");

    if (retryable && attempt < MAX_RETRIES) {
      await sleep(300 * 2 ** attempt);
      return request(path, options, attempt + 1);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchFaqs(limit = 20, offset = 0) {
  return request(`/faqs?limit=${limit}&offset=${offset}`);
}

export async function fetchQueries(limit = 20, offset = 0) {
  return request(`/queries?limit=${limit}&offset=${offset}`);
}

export async function searchFaq(keyword) {
  return request("/search", {
    method: "POST",
    body: JSON.stringify({ keyword })
  });
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

export async function fetchAnswers(questionId, limit = 20, offset = 0) {
  return request(`/answers/${questionId}?limit=${limit}&offset=${offset}`);
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

export async function fetchAdminOverview() {
  return request("/admin/overview");
}

export async function fetchPendingQueries() {
  return request("/admin/pending-queries");
}

export async function deleteFaq(id) {
  return request(`/faqs/${id}`, {
    method: "DELETE"
  });
}

export async function updateFaq(id, payload) {
  return request(`/faqs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteQuery(id) {
  return request(`/queries/${id}`, {
    method: "DELETE"
  });
}

export async function updateQuery(id, payload) {
  return request(`/queries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteAnswer(id) {
  return request(`/answers/${id}`, {
    method: "DELETE"
  });
}

export async function updateAnswer(id, payload) {
  return request(`/answers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function followResource(followableType, followableId) {
  return request("/follows", {
    method: "POST",
    body: JSON.stringify({ followableType, followableId })
  });
}

export async function unfollowResource(followId) {
  return request(`/follows/${followId}`, {
    method: "DELETE"
  });
}

export async function muteFollow(followId, isMuted) {
  return request(`/follows/${followId}/mute`, {
    method: "PATCH",
    body: JSON.stringify({ isMuted })
  });
}

export async function fetchNotifications() {
  return request("/notifications");
}

export async function markNotificationsAsRead() {
  return request("/notifications/read", {
    method: "PATCH"
  });
}

export function markNotificationAsRead(notificationId) {
  return request(`/notifications/${notificationId}/read`, {
    method: "PATCH"
  });
}

export function deleteNotification(notificationId) {
  return request(`/notifications/${notificationId}`, {
    method: "DELETE"
  });
}

export async function checkDuplicatesApi(question) {
  return request("/duplicates/check", {
    method: "POST",
    body: JSON.stringify({ question })
  });
}

export async function sendChatMessage(message, history = []) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message, history })
  });
}

export async function createFaqTranslation(faqId, payload) {
  return request(`/faqs/${faqId}/translations`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchFaqTranslations(faqId) {
  return request(`/faqs/${faqId}/translations`);
}

/**
 * Fetches all open bounties and filters them client-side by queryId.
 * @param {string} queryId - The ID of the question to find bounties for.
 * @returns {Promise<Array<{id: string, queryId: string, amount: number, createdBy: string, status: string, expiresAt: string, createdAt: string}>>} List of open bounties for the query.
 */
export async function getBounties(queryId) {
  const res = await request("/bounties");
  const bounties = res?.data || [];
  return bounties.filter(b => String(b.queryId || b.query_id) === String(queryId));
}

/**
 * Creates a new bounty for a specific question.
 * @param {string} queryId - The ID of the question.
 * @param {number} amount - The reputation amount to offer.
 * @param {number} [durationDays] - Optional duration in days.
 * @returns {Promise<{status: string, data: {id: string, queryId: string, amount: number, createdBy: string, expiresAt: string, status: string}}>}
 */
export async function createBounty(queryId, amount, durationDays) {
  const body = { queryId, amount };
  if (durationDays !== undefined) {
    body.durationDays = durationDays;
  }
  return request("/bounties", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

/**
 * Awards a bounty to a specific answer.
 * @param {string} bountyId - The ID of the bounty to award.
 * @param {string} answerId - The ID of the winning answer.
 * @returns {Promise<{status: string}>}
 */
export async function awardBounty(bountyId, answerId) {
  await request(`/bounties/${bountyId}/award`, {
    method: "POST",
    body: JSON.stringify({ answerId })
  });
  return { status: "success" };
}

export async function fetchNotificationPreferences() {
  return request("/notifications/preferences");
}

export async function updateNotificationPreferences(preferences) {
  return request("/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences)
  });
}

export async function fetchModerationQueue() {
  return request("/admin/moderation-queue");
}

export async function fetchModerationExplanation(id) {
  return request(`/admin/moderation/${id}/explanation`);
}

export async function actOnModeration(id, payload) {
  return request(`/admin/moderation/${id}/action`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function fetchKnowledgeGaps() {
  return request("/admin/knowledge-gaps");
}

export async function previewFaqImport(fileName, fileContent) {
  return request("/faqs/import/preview", {
    method: "POST",
    body: JSON.stringify({ fileName, fileContent })
  });
}

export async function confirmFaqImport(faqs) {
  return request("/faqs/import/confirm", {
    method: "POST",
    body: JSON.stringify({ faqs })
  });
}

export async function downloadFaqExport(format, mode = "raw") {
  const token = localStorage.getItem("crowdfaq-token");
  const response = await fetch(`${API_BASE_URL}/export?format=${encodeURIComponent(format)}&mode=${encodeURIComponent(mode)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  return blob;
}

export async function queryGraphQL(query, variables = {}) {
  return request("/graphql", {
    method: "POST",
    body: JSON.stringify({ query, variables })
  });
}

export async function fetchContributorLeaderboard() {
  return request("/contributors/leaderboard");
}

/**
 * Submits a content report to the moderation queue.
 * @param {string} targetId - The ID of the content being reported.
 * @param {"question"|"answer"} targetType - The type of content.
 * @param {string} reason - The selected reason code.
 * @param {string} [details] - Optional free-text details.
 */
export async function submitReport({ targetId, targetType, reason, details }) {
  return request("/reports", {
    method: "POST",
    body: JSON.stringify({ targetId, targetType, reason, details })
  });
}
