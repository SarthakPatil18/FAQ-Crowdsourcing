import {
  MessagePlusIcon, PencilIcon, SendIcon,
  MessageCircleIcon, EyeIcon, ThumbsUpIcon
} from "./ProfileIcons";

const stats = [
  { label: "FAQs Created",      value: "128",   Icon: () => <MessagePlusIcon size={18} color="#2563eb" /> },
  { label: "FAQs Edited",       value: "215",   Icon: () => <PencilIcon size={18} color="#2563eb" /> },
  { label: "Answers Submitted", value: "342",   Icon: () => <SendIcon size={18} color="#2563eb" /> },
  { label: "Comments Added",    value: "186",   Icon: () => <MessageCircleIcon size={18} color="#2563eb" /> },
  { label: "Total Views",       value: "24.6K", Icon: () => <EyeIcon size={18} color="#2563eb" /> },
  { label: "Helpful Votes",     value: "1.2K",  Icon: () => <ThumbsUpIcon size={18} color="#2563eb" /> },
];

function ProfileStats() {
  return (
    <section className="profile-stats-row">
      {stats.map((s) => (
        <div key={s.label} className="profile-stat-card">
          <div className="stat-icon-wrap">
            <s.Icon />
          </div>
          <div className="stat-text">
            <h3>{s.value}</h3>
            <p>{s.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export default ProfileStats;