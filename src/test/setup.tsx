import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import type { ImgHTMLAttributes, AnchorHTMLAttributes, PropsWithChildren } from "react";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} {...rest} />
  ),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = vi.fn() as unknown as typeof fetch;
}
