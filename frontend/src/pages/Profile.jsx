import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function Profile() {
  const [activeTab, setActiveTab] = useState("Overview");

  const stats = [
    { label: "FAQs Created", value: "48" },
    { label: "FAQs Edited", value: "126" },
    { label: "Answers", value: "342" },
    { label: "Comments", value: "189" },
    { label: "Views", value: "12.4K" },
    { label: "Helpful Votes", value: "892" },
  ];

  const tabs = [
    "Overview",
    "My Content",
    "Analytics",
    "Badges",
    "Settings",
  ];

  return (
    <>
      <Sidebar />

      <div className="main-wrapper">
        <Topbar />

        <main className="content">
          {/* Profile Header */}

          <section className="profile-header-card">
            <div className="profile-header-left">
              <div className="profile-avatar">
                AG
              </div>

              <div className="profile-user-info">
                <div className="profile-name-row">
                  <h2>Anwesha Ghosh</h2>

                  <span className="profile-role">
                    Top Contributor
                  </span>
                </div>

                <p className="profile-title">
                  Frontend Developer • Community Expert
                </p>

                <p className="profile-bio">
                  Passionate about building scalable web
                  applications and helping the community
                  find accurate answers.
                </p>

                <div className="profile-meta">
                  <span>📍 India</span>
                  <span>🏢 CrowdFAQ Team</span>
                  <span>✉ anwesha@example.com</span>
                </div>
              </div>
            </div>

            <button className="edit-profile-btn">
              Edit Profile
            </button>
          </section>

          {/* Stats */}

          <section className="profile-stats-row">
            {stats.map((item) => (
              <div
                key={item.label}
                className="profile-stat-card"
              >
                <h3>{item.value}</h3>
                <p>{item.label}</p>
              </div>
            ))}
          </section>

          {/* Tabs */}

          <section className="profile-tabs-container">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`profile-tab-btn ${
                  activeTab === tab ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </section>

          {/* Main Content */}

          {activeTab === "Overview" && (
            <div className="profile-grid">
              {/* Left Column */}

              <div className="profile-left-column">
                <div className="profile-card">
                  <h3>Recent Content</h3>

                  <div className="content-item">
                    <h4>
                      Best Practices for React State
                      Management
                    </h4>
                    <p>
                      Published 2 days ago • 523 views
                    </p>
                  </div>

                  <div className="content-item">
                    <h4>
                      Understanding Context API
                    </h4>
                    <p>
                      Published 5 days ago • 418 views
                    </p>
                  </div>

                  <div className="content-item">
                    <h4>
                      Optimizing Vite Applications
                    </h4>
                    <p>
                      Published 1 week ago • 286 views
                    </p>
                  </div>
                </div>

                <div className="profile-card">
                  <h3>Analytics Overview</h3>

                  <div className="analytics-grid">
                    <div className="analytics-box">
                      <span>Engagement</span>
                      <strong>94%</strong>
                    </div>

                    <div className="analytics-box">
                      <span>Response Rate</span>
                      <strong>89%</strong>
                    </div>

                    <div className="analytics-box">
                      <span>Growth</span>
                      <strong>+18%</strong>
                    </div>

                    <div className="analytics-box">
                      <span>Reach</span>
                      <strong>22K</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}

              <div className="profile-right-column">
                <div className="profile-card">
                  <h3>Top FAQ</h3>

                  <h4>
                    How does React Context differ from
                    Redux?
                  </h4>

                  <p>
                    1.4K Views • 245 Helpful Votes
                  </p>
                </div>

                <div className="profile-card">
                  <h3>Badges</h3>

                  <div className="badges-grid">
                    <span className="badge">
                      🏆 Expert
                    </span>

                    <span className="badge">
                      ⭐ Top Contributor
                    </span>

                    <span className="badge">
                      🚀 Rising Star
                    </span>

                    <span className="badge">
                      💡 Innovator
                    </span>
                  </div>
                </div>

                <div className="profile-card">
                  <h3>Recent Activity</h3>

                  <ul className="activity-list">
                    <li>
                      Answered a React question
                    </li>

                    <li>
                      Updated FAQ article
                    </li>

                    <li>
                      Earned Top Contributor badge
                    </li>

                    <li>
                      Received 25 helpful votes
                    </li>
                  </ul>
                </div>

                <div className="profile-card">
                  <h3>Quick Links</h3>

                  <div className="quick-links">
                    <button>
                      My Drafts
                    </button>

                    <button>
                      Saved FAQs
                    </button>

                    <button>
                      Notifications
                    </button>

                    <button>
                      Account Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "Overview" && (
            <div className="profile-card">
              <h2>{activeTab}</h2>

              <p>
                Content for {activeTab} will be
                implemented here.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default Profile;