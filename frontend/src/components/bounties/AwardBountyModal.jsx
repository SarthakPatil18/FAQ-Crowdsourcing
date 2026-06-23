import React, { useState, useEffect } from "react";
import { awardBounty } from "../../api/faqApi";

function AwardBountyModal({ open, onClose, bounty, answers = [], onSuccess }) {
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [step, setStep] = useState("select"); // "select" | "confirm"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
      setSelectedAnswerId(null);
      setStep("select");
      setError(null);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !bounty) return null;

  const handleSubmit = async () => {
    if (!selectedAnswerId) return;
    setLoading(true);
    setError(null);
    try {
      await awardBounty(bounty.id || bounty._id, selectedAnswerId);
      onSuccess();
      onClose();
    } catch (err) {
      // Branch on specific error codes if available
      let errorMsg = err.message || "Failed to award bounty.";
      if (err.code) {
        if (err.code === "BOUNTY_ALREADY_CLOSED") errorMsg = "This bounty has already been closed or awarded.";
        else if (err.code === "ANSWER_NOT_FOUND") errorMsg = "The selected answer could not be found. It may have been deleted.";
        else if (err.code === "VALIDATION_ERROR") errorMsg = "Invalid request payload.";
        else if (err.code === "FORBIDDEN") errorMsg = "You do not have permission to award this bounty.";
      }
      setError(errorMsg);
      setStep("select"); // go back to select step on error
    } finally {
      setLoading(false);
    }
  };

  const eligibleAnswers = answers.filter(a => {
    // Unsynced answers are excluded from eligibility since they don't exist in the backend yet
    const isOffline = a.isOffline || String(a.id).includes('-') || String(a.id).startsWith('local-');
    return !isOffline;
  });

  const ineligibleAnswers = answers.filter(a => {
    const isOffline = a.isOffline || String(a.id).includes('-') || String(a.id).startsWith('local-');
    return isOffline;
  });

  const selectedAnswer = eligibleAnswers.find(a => a.id === selectedAnswerId);

  return (
    <div className="modal-overlay active" onClick={!loading ? onClose : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2>Award Bounty</h2>
          <button className="modal-close" onClick={!loading ? onClose : undefined} disabled={loading}>×</button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", paddingBottom: "20px", flex: 1 }}>
          {error && (
            <div style={{
              padding: "12px",
              marginBottom: "16px",
              borderRadius: "6px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--accent-red)",
              fontSize: "13px",
              fontWeight: "500"
            }}>
              ⚠️ {error}
            </div>
          )}

          {step === "select" && (
            <>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Select an answer to award the <strong>{bounty.amount} Reputation</strong> bounty to. 
              </p>
              
              {eligibleAnswers.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "14px", padding: "20px 0", textAlign: "center", fontStyle: "italic", backgroundColor: "var(--surface-secondary, rgba(0,0,0,0.02))", borderRadius: "8px" }}>
                  No answers are eligible for this bounty yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {eligibleAnswers.map(answer => {
                    const authorName = answer.author || answer.authorName || "Community Member";
                    const isSelected = selectedAnswerId === answer.id;
                    const snippet = answer.content ? answer.content.substring(0, 100) + (answer.content.length > 100 ? "..." : "") : "No content";
                    
                    return (
                      <div 
                        key={answer.id}
                        onClick={() => { if (!loading) setSelectedAnswerId(answer.id); }}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: isSelected ? "2px solid var(--accent-orange)" : "1px solid var(--border)",
                          backgroundColor: isSelected ? "var(--accent-soft, rgba(245, 158, 11, 0.05))" : "var(--bg-color)",
                          cursor: loading ? "not-allowed" : "pointer",
                          display: "flex",
                          gap: "12px",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "40px" }}>
                          <span style={{ fontSize: "16px", color: "var(--text-secondary)" }}>▲</span>
                          <span style={{ fontWeight: "bold", fontSize: "14px", color: "var(--text-primary)" }}>{answer.votes || 0}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflow: "hidden" }}>
                          <span style={{ fontWeight: "600", fontSize: "14px", color: "var(--text-primary)" }}>
                            {authorName}
                          </span>
                          <span style={{ fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {snippet}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", paddingLeft: "8px" }}>
                          <input 
                            type="radio" 
                            checked={isSelected} 
                            readOnly 
                            style={{ cursor: "pointer", width: "18px", height: "18px", accentColor: "var(--accent-orange)" }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {ineligibleAnswers.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <h4 style={{ fontSize: "13px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Not yet eligible</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", opacity: 0.7 }}>
                    {ineligibleAnswers.map(answer => {
                      const authorName = answer.author || answer.authorName || "Community Member";
                      const snippet = answer.content ? answer.content.substring(0, 100) + (answer.content.length > 100 ? "..." : "") : "No content";
                      
                      return (
                        <div 
                          key={answer.id}
                          style={{
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--surface-secondary, rgba(0,0,0,0.02))",
                            cursor: "not-allowed",
                            display: "flex",
                            gap: "12px"
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "40px" }}>
                            <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>▲</span>
                            <span style={{ fontWeight: "bold", fontSize: "14px", color: "var(--text-muted)" }}>{answer.votes || 0}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflow: "hidden" }}>
                            <span style={{ fontWeight: "600", fontSize: "14px", color: "var(--text-muted)" }}>
                              {authorName}
                            </span>
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {snippet}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--accent-red)", marginTop: "2px", fontWeight: "500" }}>
                              This answer is currently offline. It must sync before receiving a bounty.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {step === "confirm" && selectedAnswer && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
              <h3 style={{ margin: "0 0 12px", color: "var(--text-primary)" }}>Confirm Award</h3>
              <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
                Award <strong>{bounty.amount} reputation</strong> to <strong>{selectedAnswer.author || selectedAnswer.authorName || "Community Member"}</strong>'s answer?<br/><br/>
                <span style={{ color: "var(--accent-red)", fontWeight: "500" }}>This action cannot be undone.</span>
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ flexShrink: 0 }}>
          {step === "select" ? (
            <>
              <button className="modal-cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button 
                className="modal-submit" 
                onClick={() => setStep("confirm")} 
                disabled={!selectedAnswerId || loading}
                style={{
                  backgroundColor: !selectedAnswerId ? "var(--border)" : "var(--accent-orange)",
                  color: !selectedAnswerId ? "var(--text-muted)" : "var(--bg-white, #fff)",
                  cursor: !selectedAnswerId ? "not-allowed" : "pointer"
                }}
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <button className="modal-cancel" onClick={() => setStep("select")} disabled={loading}>
                Back
              </button>
              <button 
                className="modal-submit" 
                onClick={handleSubmit} 
                disabled={loading}
                style={{
                  backgroundColor: "var(--accent-red)", // Destructive confirmation color
                  color: "var(--bg-white, #fff)",
                }}
              >
                {loading ? "Awarding..." : "Yes, Award Bounty"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AwardBountyModal;
