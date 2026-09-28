import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Visual Identity & Branding", () => {
  const root = process.cwd();

  it("official logo asset exists with exact 1:1 aspect ratio", () => {
    const logoPath = path.join(root, "public", "logo.png");
    expect(fs.existsSync(logoPath)).toBe(true);

    const buf = fs.readFileSync(logoPath);
    // Verify PNG magic header
    expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");

    // Width and height in IHDR chunk
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBe(1254);
    expect(height).toBe(1254);
    expect(width / height).toBe(1); // Exact 1:1 aspect ratio
  });

  it("globals.css defines theme-adaptive brand-banner for light and dark modes", () => {
    const cssPath = path.join(root, "src", "app", "globals.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    // Light mode: brand-green background with dark zellige
    expect(css).toContain(".brand-banner {");
    expect(css).toContain("background-color: var(--brand-green);");
    expect(css).toContain("zellige-dark.svg");

    // Dark mode: light ivory background with light zellige
    expect(css).toContain(".dark .brand-banner {");
    expect(css).toContain("background-color: var(--brand-ivory);");
    expect(css).toContain("zellige.svg");
  });

  it("layout.tsx enforces theme-adaptive header title colors (WHITE in light, GREEN in dark)", () => {
    const layoutPath = path.join(root, "src", "app", "[locale]", "layout.tsx");
    const layout = fs.readFileSync(layoutPath, "utf-8");

    // Header has brand-banner class
    expect(layout).toContain('header className="brand-banner');

    // Title has text-white for light mode, dark:text-nour-green-900 for dark mode
    expect(layout).toContain("text-white dark:text-nour-green-900");

    // Subtitle adapts smoothly
    expect(layout).toContain("text-nour-gold-300 dark:text-nour-green-800/90");

    // Logo image is responsive with 1:1 aspect ratio container and proper padding
    expect(layout).toContain('src="/logo.png"');
    expect(layout).toContain("h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16");
    expect(layout).toContain("object-contain");
  });

  it("theme toggle and auth status have high-contrast theme-aware classes", () => {
    const togglePath = path.join(root, "src", "components", "ThemeToggle.tsx");
    const toggle = fs.readFileSync(togglePath, "utf-8");
    expect(toggle).toContain("text-foreground");
    expect(toggle).toContain("bg-surface");

    const authPath = path.join(root, "src", "components", "auth", "AuthStatus.tsx");
    const auth = fs.readFileSync(authPath, "utf-8");
    expect(auth).toContain("text-foreground");
    expect(auth).toContain("bg-surface");
  });
});
