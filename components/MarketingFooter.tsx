import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Features", href: "/features" },
  { label: "Tools", href: "/tools" },
  { label: "Blog", href: "/blog" },
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function MarketingFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid #e8e5e0",
        background: "#fff",
        padding: "80px 24px 40px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 48,
            marginBottom: 48,
          }}
        >
          {/* Brand */}
          <div style={{ maxWidth: 300 }}>
            <Image
              src="/brand/logo.png"
              alt="ClearBible"
              width={180}
              height={44}
              style={{ height: 40, width: "auto", objectFit: "contain", marginBottom: 16 }}
            />
            <p
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#2a2520",
                margin: "0 0 8px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Understand. Remember. Apply.
            </p>
            <p style={{ fontSize: 14, color: "#6a655e", lineHeight: 1.6 }}>
              ClearBible helps you understand scripture so you actually remember what you read and can apply it to your life.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#2a2520",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 16,
                }}
              >
                Product
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {FOOTER_LINKS.slice(0, 5).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      fontSize: 14,
                      color: "#6a655e",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#2a2520",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 16,
                }}
              >
                Legal
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {FOOTER_LINKS.slice(5).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      fontSize: 14,
                      color: "#6a655e",
                      textDecoration: "none",
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/refunds"
                  style={{
                    fontSize: 14,
                    color: "#6a655e",
                    textDecoration: "none",
                  }}
                >
                  Refunds
                </Link>
                <a
                  href="mailto:support@clearbible.ai"
                  style={{
                    fontSize: 14,
                    color: "#6a655e",
                    textDecoration: "none",
                  }}
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            borderTop: "1px solid #e8e5e0",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <p style={{ fontSize: 13, color: "#b0a89e" }}>
            &copy; {new Date().getFullYear()} ClearBible.ai. All rights reserved.
          </p>
          <p style={{ fontSize: 13, color: "#b0a89e" }}>
            support@clearbible.ai
          </p>
        </div>
      </div>
    </footer>
  );
}
