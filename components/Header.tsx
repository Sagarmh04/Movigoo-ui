"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Menu, Search, UserRound, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useFakeUser } from "@/hooks/useFakeUser";

const navItems = [
	{ label: "Home", href: "/" },
	{ label: "Events", href: "/events" },
	{ label: "Locations", href: "/locations" },
	{ label: "My Bookings", href: "/my-bookings" },
	{ label: "Profile", href: "/profile" }
];

function DesktopNav() {
	const pathname = usePathname();

	return (
		<nav className="hidden items-center gap-4 lg:flex">
			{navItems.map((item) => (
				<Link key={item.href} href={item.href} className="relative text-sm font-medium">
					<span
						className={cn(
							"rounded-full px-4 py-1.5 text-slate-300 transition hover:text-white",
							pathname === item.href ? "text-white" : undefined
						)}
					>
						{item.label}
					</span>
					{pathname === item.href && (
						<motion.span
							layoutId="nav-pill"
							className="absolute inset-0 -z-10 rounded-full bg-white/10"
						/>
					)}
				</Link>
			))}
		</nav>
	);
}

const Header = () => {
	const pathname = usePathname();
	const { user } = useFakeUser();
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setIsScrolled(window.scrollY > 16);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<motion.header
			className="fixed left-0 right-0 top-0 z-40"
		>
			<div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-10">
				<Link href="/" className="flex items-center gap-2 font-semibold text-white">
					<motion.div
						layoutId="logo-pill"
						className="rounded-2xl bg-gradient-to-r from-gradient-indigo to-indigo-600 px-3 py-2 text-xs uppercase tracking-[0.3em]"
					>
						MOVIGOO
					</motion.div>
				</Link>

				<div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 md:flex">
					<MapPin size={14} className="text-accent-amber" />
					Mumbai, India
				</div>

				<div className="hidden flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 md:flex">
					<Search size={16} className="text-slate-400" />
					<Input className="border-none bg-transparent p-0 text-sm" placeholder="Search concerts, sports, arts..." />
				</div>

				<DesktopNav />

				<div className="hidden items-center gap-2 lg:flex">
					<Button variant="ghost" size="sm" className="h-10 w-10 rounded-full border border-white/10 p-0">
						<Bell size={18} />
					</Button>
					<Button variant="amber" size="sm" className="flex items-center gap-2 rounded-full px-4">
						<UserRound size={16} />
						<span>{("name" in user ? user.name : "") || ("email" in user ? user.email : "") || "User"}</span>
					</Button>
				</div>

				<div className="flex flex-1 items-center justify-end gap-2 lg:hidden">
					<Button variant="ghost" size="sm" className="rounded-full">
						<Search size={18} />
					</Button>
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="outline" size="sm" className="rounded-full px-3">
								<Menu size={18} />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="border-white/10 bg-slate-900/95 p-0">
							<div className="space-y-6 p-6">
								<div className="space-y-2">
									<p className="text-xs uppercase tracking-[0.3em] text-slate-500">Navigation</p>
									<div className="grid gap-2">
										{navItems.map((item) => (
											<Link
												key={item.href}
												href={item.href}
												className={cn(
													"rounded-2xl px-4 py-3 text-base font-medium text-slate-200 transition hover:bg-white/5",
													pathname === item.href ? "bg-white/10 text-white" : undefined
												)}
											>
												{item.label}
											</Link>
										))}
									</div>
								</div>

								<div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
									<p className="text-xs text-slate-400">Quick Search</p>
									<div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
										<Search size={16} className="text-slate-400" />
										<Input placeholder="Artist, city, genre..." className="border-none bg-transparent p-0" />
									</div>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</motion.header>
	);
};

export default Header;

