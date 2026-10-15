"use client";

export default function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="footer-person-link"
    >
      {children}
      <style>{`
        .footer-person-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: rgba(242,238,230,0.88);
          text-decoration: none;
          border-bottom: 1px solid rgba(242,238,230,0.2);
          padding-bottom: 1px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .footer-person-link:hover {
          color: #b7c9a8;
          border-bottom-color: rgba(183,201,168,0.5);
        }
      `}</style>
    </a>
  );
}
