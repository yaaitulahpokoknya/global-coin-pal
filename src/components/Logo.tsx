import logo from "@/assets/logo.png";
import { Link } from "@tanstack/react-router";

export function Logo({ withText = true, size = "md" }: { withText?: boolean; size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 28 : size === "lg" ? 44 : 36;
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5">
      <span className="relative inline-flex items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl bg-gradient-bicolor opacity-40 blur-md transition-opacity group-hover:opacity-70"
        />
        <img
          src={logo}
          alt="NusaWallet logo"
          width={px}
          height={px}
          className="relative drop-shadow-[0_2px_10px_rgba(99,102,241,0.45)]"
        />
      </span>
      {withText && (
        <span className="font-display text-lg font-semibold tracking-tight">
          Nusa<span className="text-gradient-bicolor">Wallet</span>
        </span>
      )}
    </Link>
  );
}
