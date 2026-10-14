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
          color: rgba(238,240,246,0.6);
          text-decoration: none;
          border-bottom: 1px solid rgba(238,240,246,0.18);
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .footer-person-link:hover {
          color: rgb(110,210,200);
          border-bottom-color: rgba(110,210,200,0.45);
        }
      `}</style>
    </a>
  );
}
