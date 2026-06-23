import React, { useState, useEffect } from 'react';
import { getBounties } from '../../api/faqApi';
import { useAuth } from '../../context/AuthContext';
import CreateBountyModal from './CreateBountyModal';
import AwardBountyModal from './AwardBountyModal';

function BountyPanel({ questionId, question, answers = [], onBountyAwarded }) {
  const { user, refreshUser } = useAuth();
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [awardModalBounty, setAwardModalBounty] = useState(null);
  const [toast, setToast] = useState(null);

  // Feature flag for the Award Bounty flow until backend security ticket is resolved
  const ENABLE_AWARD_FLOW = process.env.NODE_ENV === "development";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBountyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBounties(questionId);
      setBounties(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch bounties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId && questionId !== "test-id" && questionId !== "undefined") {
      fetchBountyData();
    } else {
      setLoading(false);
    }
  }, [questionId]);

  if (loading) {
    return (
      <div style={{ color: "var(--text-muted)", padding: "20px", fontSize: "14px", backgroundColor: "var(--surface-secondary, rgba(0,0,0,0.02))", borderRadius: "8px", margin: "16px 0", textAlign: "center", minHeight: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading bounties...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "var(--accent-red)", padding: "16px 0", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
        <span>⚠️ {error}</span>
        <button 
          onClick={fetchBountyData}
          style={{ background: "transparent", border: "1px solid var(--accent-red)", color: "var(--accent-red)", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}
        >
          Retry
        </button>
      </div>
    );
  }

  const isAuthor = user && question && String(user.id) === String(question.authorId || question.userId || question.user_id);
  const userReputation = user?.reputation || 0;
  const canAffordMinTiers = userReputation >= 50;

  // Eligible answers count must exclude offline/unsynced answers
  const eligibleCount = answers 
    ? answers.filter(a => !(a.isOffline || String(a.id).includes('-') || String(a.id).startsWith('local-'))).length 
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h3 style={{ fontSize: "16px", margin: 0, color: "var(--text-primary)" }}>Bounties</h3>
        {isAuthor && (
          <button
            onClick={() => canAffordMinTiers && setShowCreateModal(true)}
            disabled={!canAffordMinTiers}
            title={!canAffordMinTiers ? "You need at least 50 reputation to sponsor a bounty." : "Sponsor a new bounty"}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: "1px dashed var(--border-color, #ccc)",
              color: canAffordMinTiers ? "var(--text-secondary)" : "var(--text-muted)",
              cursor: canAffordMinTiers ? "pointer" : "not-allowed",
              opacity: canAffordMinTiers ? 1 : 0.6
            }}
          >
            + Sponsor Bounty
          </button>
        )}
      </div>

      {bounties.length === 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: "13.5px", padding: "12px 0", fontStyle: "italic" }}>
          No active bounties for this question.
        </div>
      )}
      {bounties.map((bounty) => {
        // Resolve author name
        let authorName = "Community Member";
        if (user && String(user.id) === String(bounty.createdBy)) {
          authorName = user.name || "You";
        } else if (question && String(question.authorId || question.userId || question.user_id) === String(bounty.createdBy)) {
          authorName = question.author || "Community Member";
        } else {
          const ansMatch = answers?.find(a => String(a.userId || a.user_id || a.authorId) === String(bounty.createdBy));
          if (ansMatch && ansMatch.author) {
            authorName = ansMatch.author;
          }
        }

        // Calculate time remaining
        const expires = new Date(bounty.expiresAt);
        const now = new Date();
        const isExpired = expires < now;
        const daysRemaining = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));

        // NOTE: this client-side ownership check does NOT prevent a non-creator
        // from awarding this bounty via a direct API call — the backend does not
        // enforce req.user.id === bounty.createdBy. Tracked as a backend security
        // ticket; do not remove this check, but do not treat it as sufficient
        // either. Feature-flagged out of prod below.
        const canAward = ENABLE_AWARD_FLOW && user && String(user.id) === String(bounty.createdBy) && !isExpired;

        return (
          <div key={bounty.id} style={{
            padding: "16px",
            borderRadius: "8px",
            backgroundColor: isExpired ? "var(--surface-secondary, rgba(0,0,0,0.05))" : "var(--accent-soft, rgba(245, 158, 11, 0.1))",
            border: `1px solid ${isExpired ? "var(--border, #ccc)" : "var(--accent-orange, #f59e0b)"}`,
            color: isExpired ? "var(--text-muted)" : "var(--accent-orange, #f59e0b)",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.2rem", filter: isExpired ? "grayscale(100%) opacity(0.6)" : "none" }}>💰</span>
                <span style={{ fontWeight: "600", fontSize: "15px", color: isExpired ? "inherit" : "var(--accent-orange, #d97706)" }}>
                  {bounty.amount} Reputation Bounty
                </span>
                {isExpired && (
                  <span style={{ fontSize: "11px", padding: "2px 6px", background: "var(--border, #ccc)", color: "var(--bg-white, #fff)", borderRadius: "4px", fontWeight: "bold" }}>
                    EXPIRED
                  </span>
                )}
              </div>
              <div style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--border, #ddd)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary, #333)", fontWeight: "bold", fontSize: "12px" }}>
                  {authorName.charAt(0).toUpperCase()}
                </span>
                <span>Offered by <strong>{authorName}</strong></span>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", marginTop: "2px", flexWrap: "wrap", gap: "8px", color: "var(--text-secondary)" }}>
              <span>
                <strong>{eligibleCount}</strong> eligible {eligibleCount === 1 ? 'answer' : 'answers'} 
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", opacity: 0.9 }}>
                <span>
                  {isExpired ? (
                    `Expired on ${expires.toLocaleDateString()}`
                  ) : (
                    `Expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} (${expires.toLocaleDateString()})`
                  )}
                </span>
                {canAward && (
                  <button
                    onClick={() => setAwardModalBounty(bounty)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      backgroundColor: "var(--accent-orange, #f59e0b)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    Award Bounty
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <CreateBountyModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        questionId={questionId}
        userReputation={userReputation}
        onSuccess={async () => {
          await refreshUser();
          fetchBountyData();
          showToast("Bounty sponsored successfully!");
        }}
        hasOpenBounties={bounties.some(b => new Date(b.expiresAt) > new Date())}
      />
      <AwardBountyModal
        open={!!awardModalBounty}
        onClose={() => setAwardModalBounty(null)}
        bounty={awardModalBounty}
        answers={answers}
        onSuccess={() => {
          fetchBountyData();
          showToast("Bounty awarded successfully!");
          if (onBountyAwarded) onBountyAwarded();
        }}
      />
      {toast && (
        <div className={`auth-toast ${toast.type}`}>
          <span>{toast.msg}</span>
          <button type="button" onClick={() => setToast(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'inherit' }}>×</button>
        </div>
      )}
    </div>
  );
}

export default BountyPanel;
