import { useFAQ } from "../context/FAQContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function Topbar({ openModal }) {
  const { searchQuery, setSearchQuery } = useFAQ();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/notifications", {
      headers: { "user-id": "1" }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setNotifications(data.data);
        }
      })
      .catch(err => console.error("Failed to fetch notifications:", err));
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotifClick = () => {
    const nextShow = !showDropdown;
    setShowDropdown(nextShow);

    if (nextShow && unreadCount > 0) {
      fetch("http://localhost:5000/api/notifications/read", {
        method: "PATCH",
        headers: { "user-id": "1", "Content-Type": "application/json" }
      })
        .then(() => {
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        })
        .catch(err => console.error("Failed to mark notifications as read:", err));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      navigate("/questions");
    }
  };

  return (
    <header className="topbar">
      <div className="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Search questions, topics, contributors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      <div className="topbar-actions">
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button className="notif-btn" onClick={handleNotifClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {unreadCount > 0 && <span className="notif-dot"></span>}
          </button>
          
          {showDropdown && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "#fff", 
              border: "1px solid #e5e5e5", borderRadius: "8px", width: "320px", 
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, display: "flex", flexDirection: "column"
            }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e5e5" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>Notifications</h4>
              </div>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <p style={{ margin: 0, padding: "20px", textAlign: "center", color: "#999", fontSize: "13px" }}>No notifications yet.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <p style={{ margin: 0, fontSize: "13px", color: "#1a1a1a", lineHeight: 1.4 }}>{n.message || "Someone interacted with your post."}</p>
                      <span style={{ fontSize: "11px", color: "#999" }}>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="ask-btn" onClick={openModal}>
          + Ask Question
        </button>

        <div className="avatar">S</div>
      </div>
    </header>
  );
}

export default Topbar;