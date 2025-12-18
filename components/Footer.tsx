import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";

const socials = [
  { icon: <Instagram size={18} />, href: "https://instagram.com/movigoo" },
  { icon: <Twitter size={18} />, href: "https://x.com/movigoo" },
  { icon: <Linkedin size={18} />, href: "https://linkedin.com/company/movigoo" }
];

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-white/5 bg-slate-950/70 py-12 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:px-6 lg:px-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-gradient">Movigoo</p>
          <p className="text-sm text-slate-400">
            Event Discovery and premium booking
          </p>
          <div className="flex gap-2">
            {socials.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-slate-300 transition hover:border-white/40 hover:text-white"
              >
                {item.icon}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-6 text-sm text-slate-400 md:grid-cols-3">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-500">Platform</p>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="transition hover:text-white">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/coming-soon" className="transition hover:text-white">
                  Coming Soon
                </Link>
              </li>
              <li>
                <Link href="/locations" className="transition hover:text-white">
                  Venues
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-500">Support</p>
            <ul className="space-y-2">
              <li>
                <Link href="/refund-policy" className="transition hover:text-white">
                  Refunds
                </Link>
              </li>
              <li>
                <Link href="/shipping-return-policy" className="transition hover:text-white">
                  Shipping & Returns
                </Link>
              </li>
              <li>Partner with us</li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-500">Legal</p>
            <ul className="space-y-2">
              <li>
                <Link href="/about-us" className="transition-colors duration-200 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="transition-colors duration-200 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="transition-colors duration-200 hover:text-white">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-return-policy" className="transition-colors duration-200 hover:text-white">
                  Shipping & Return
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} Movigoo.</p>
    </footer>
  );
};

export default Footer;

