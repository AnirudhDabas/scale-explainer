"use client";

import { useEffect, useState } from "react";

interface RepoData {
  stars: number;
  forks: number;
  description: string;
  language: string;
  topics: string[];
  updated_at: string;
}

const STATIC: RepoData = {
  stars: 3,
  forks: 2,
  description: "Point at furniture, get real products that provably fit. LiDAR measurement + multimodal search + 1:1 placement in XR.",
  language: "TypeScript",
  topics: ["cloudflare", "pointcloud", "reconstruction", "vr", "webxr"],
  updated_at: "2026-10-15T02:27:11Z",
};

export default function GithubCard() {
  const [repo, setRepo] = useState<RepoData>(STATIC);

  useEffect(() => {
    fetch("https://api.github.com/repos/ThomasZhang223/scale")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setRepo({
        stars: d.stargazers_count,
        forks: d.forks_count,
        description: d.description,
        language: d.language,
        topics: d.topics ?? [],
        updated_at: d.updated_at,
      }))
      .catch(() => {});
  }, []);

  const updatedAgo = (() => {
    const ms = Date.now() - new Date(repo.updated_at).getTime();
    const days = Math.floor(ms / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  })();

  return (
    <a
      href="https://github.com/ThomasZhang223/Scale"
      target="_blank"
      rel="noopener noreferrer"
      className="group block focus-ring rounded-2xl"
      aria-label="View Scale on GitHub"
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "rgba(22,28,24,0.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,

          transition: "border-color 0.2s ease, background 0.2s ease",
        }}
        className="p-5 sm:p-8 group-hover:border-[rgba(183,201,168,0.3)]"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            {/* GitHub icon */}
            <svg className="shrink-0 mt-1" width="22" height="22" viewBox="0 0 24 24" fill="rgba(242,238,230,0.7)" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span style={{ fontSize: 13, color: "#bec7be", fontFamily: "'JetBrains Mono', monospace" }}>ThomasZhang223 /</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#f2eee6", fontFamily: "'DM Sans', sans-serif" }}>Scale</span>
              </div>
              <p style={{ fontSize: 13.5, color: "#bec7be", marginTop: 4, maxWidth: 460, lineHeight: 1.5 }}>
                {repo.description}
              </p>
            </div>
          </div>

          {/* Arrow */}
          <svg
            width="16" height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0 mt-1 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          >
            <path d="M3 13L13 3M13 3H6M13 3V10" stroke="rgba(183,201,168,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Topics */}
        <div className="flex flex-wrap gap-2 mb-5">
          {repo.topics.map(t => (
            <span
              key={t}
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#b7c9a8",
                background: "rgba(183,201,168,0.08)",
                border: "1px solid rgba(183,201,168,0.18)",
                borderRadius: 6,
                padding: "2px 8px",
                letterSpacing: "0.02em",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* Language */}
          <div className="flex items-center gap-2">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3178c6", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#bec7be" }}>{repo.language}</span>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(242,238,230,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span style={{ fontSize: 12, color: "#bec7be" }}>{repo.stars}</span>
          </div>

          {/* Forks */}
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(242,238,230,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
              <path d="M12 7v3M5 17v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>
            </svg>
            <span style={{ fontSize: 12, color: "#bec7be" }}>{repo.forks}</span>
          </div>

          <span style={{ fontSize: 12, color: "#bec7be", marginLeft: "auto" }}>
            Updated {updatedAgo}
          </span>
        </div>
      </div>
    </a>
  );
}
