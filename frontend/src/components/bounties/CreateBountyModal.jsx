import React, { useState, useEffect } from "react";
import { createBounty } from "../../api/faqApi";

function CreateBountyModal({ open, onClose, questionId, userReputation, onSuccess, hasOpenBounties }) {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
      setSelectedAmount(50); // reset on open
      setError(null);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const tiers = [50, 100, 250, 500];
  const resultingBalance = userReputation - selectedAmount;
  const isInvalid = resultingBalance < 0 || hasOpenBounties;

  const handleSubmit = async () => {
    if (isInvalid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await createBounty(questionId, selectedAmount);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create bounty");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={!loading ? onClose : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
        <div className="modal-header">
          <h2>Sponsor a Bounty</h2>
          <button className="modal-close" onClick={!loading ? onClose : undefined} disabled={loading}>×</button>
        </div>

        <div className="modal-body">
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

          {hasOpenBounties && (
            <div style={{
              padding: "12px",
              marginBottom: "16px",
              borderRadius: "6px",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "var(--accent-blue)",
              fontSize: "13px"
            }}>
              ℹ️ <strong>Note:</strong> This question already has an open bounty. The backend does not officially prevent multiple bounties, but client-side creation is disabled until the active bounty is awarded or expires to prevent duplicate charges.
            </div>
          )}

          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Offer a reputation reward to attract high-quality answers. The amount will be deducted from your balance immediately.
          </p>

          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-primary)" }}>
            Select Bounty Amount
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
            {tiers.map((tier) => (
              <button
                key={tier}
                type="button"
                disabled={loading}
                onClick={() => setSelectedAmount(tier)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: selectedAmount === tier ? "2px solid var(--accent-orange)" : "1px solid var(--border)",
                  backgroundColor: selectedAmount === tier ? "var(--accent-soft, rgba(245, 158, 11, 0.05))" : "transparent",
                  color: selectedAmount === tier ? "var(--accent-orange)" : "var(--text-primary)",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: selectedAmount === tier ? "bold" : "normal",
                  fontSize: "15px",
                  transition: "all 0.2s"
                }}
              >
                {tier} Rep
              </button>
            ))}
          </div>

          <div style={{ 
            padding: "16px", 
            borderRadius: "8px", 
            backgroundColor: "var(--surface-secondary, rgba(0,0,0,0.02))",
            border: "1px solid var(--border)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Current Balance:</span>
              <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{userReputation} Rep</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Bounty Cost:</span>
              <span style={{ fontWeight: "600", color: "var(--accent-red)" }}>-{selectedAmount} Rep</span>
            </div>
            <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "10px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
              <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>Resulting Balance:</span>
              <span style={{ fontWeight: "bold", color: isInvalid ? "var(--accent-red)" : "var(--text-primary)" }}>
                {resultingBalance} Rep
              </span>
            </div>
            
            {resultingBalance < 0 && (
              <div style={{ color: "var(--accent-red)", fontSize: "12px", marginTop: "8px", textAlign: "right" }}>
                Insufficient reputation for this bounty amount.
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="modal-submit" 
            onClick={handleSubmit} 
            disabled={isInvalid || loading}
            style={{
              backgroundColor: isInvalid ? "var(--border)" : "var(--accent-orange)",
              color: isInvalid ? "var(--text-muted)" : "var(--bg-white, #fff)",
              cursor: isInvalid || loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Creating..." : "Confirm Bounty"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateBountyModal;
