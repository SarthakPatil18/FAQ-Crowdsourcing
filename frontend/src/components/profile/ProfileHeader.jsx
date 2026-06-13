import { PencilIcon, UsersIcon, MapPinIcon, MailIcon } from "./ProfileIcons";

function ProfileHeader() {
  return (
    <section className="profile-header-card">
      <div className="profile-header-left">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-blank">
            <UsersIcon size={40} color="#94a3b8" />
          </div>
          <button className="avatar-edit-btn" aria-label="Edit photo">
            <PencilIcon size={11} color="#64748b" />
          </button>
        </div>

        <div className="profile-user-info">
          <div className="profile-name-row">
            <h2 className="profile-name">John Doe</h2>
            <span className="profile-pro-badge">Pro</span>
          </div>
          <p className="profile-handle">@johndoe</p>
          <p className="profile-title">Product Designer at CrowdFAQ</p>
          <div className="profile-meta">
            <span className="profile-meta-item">
              <MapPinIcon size={13} color="#9ca3af" /> San Francisco, USA
            </span>
            <span className="profile-meta-item">
              <UsersIcon size={13} color="#9ca3af" /> Design Team
            </span>
          </div>
          <p className="profile-bio">
            I love building user-friendly products and sharing knowledge with the community.
          </p>
          <a href="mailto:john@crowdfaq.com" className="profile-email-link">
            <MailIcon size={13} color="#2563eb" />
            john@crowdfaq.com
          </a>
        </div>
      </div>

      <div className="profile-header-right">
        <button className="edit-profile-btn">
          <PencilIcon size={13} color="#374151" /> Edit Profile
        </button>
        <div className="profile-details-grid">
          {[
            ["Username",     "@johndoe"],
            ["Email",        "john@crowdfaq.com"],
            ["Role",         "Product Designer"],
            ["Organization", "CrowdFAQ Inc."],
            ["Member since", "Mar 10, 2024"],
          ].map(([label, value]) => (
            <div className="profile-detail-row" key={label}>
              <span className="detail-label">{label}</span>
              <span className="detail-value">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProfileHeader;