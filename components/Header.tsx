"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Menu, Search, UserRound, Bell, X, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSearchContext } from "@/context/SearchContext";

const navItems = [
	{ label: "Home", href: "/" },
	{ label: "Events", href: "/events" },
	{ label: "Movies", href: "#", isComingSoon: true },
	{ label: "My Bookings", href: "/my-bookings" },
	{ label: "Profile", href: "/profile" }
];

function DesktopNav({ onMoviesClick }: { onMoviesClick: () => void }) {
	const pathname = usePathname();

	return (
		<nav className="hidden items-center gap-4 lg:flex">
			{navItems.map((item) => {
				if (item.isComingSoon) {
					return (
						<button
							key={item.label}
							onClick={onMoviesClick}
							className="relative text-sm font-medium"
						>
							<span className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-slate-300 transition hover:text-white">
								<Film size={14} />
								{item.label}
							</span>
						</button>
					);
				}
				return (
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
				);
			})}
		</nav>
	);
}

const Header = () => {
	const pathname = usePathname();
	const router = useRouter();
	const { user } = useAuth();
	const { searchQuery, setSearchQuery } = useSearchContext();
	const [isScrolled, setIsScrolled] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [localSearchValue, setLocalSearchValue] = useState("");
	const [showComingSoon, setShowComingSoon] = useState(false);
	const [animateMovie, setAnimateMovie] = useState(false);

	const handleMoviesClick = () => {
		setAnimateMovie(true);
		setTimeout(() => {
			setShowComingSoon(true);
			setAnimateMovie(false);
		}, 500);
	};

	useEffect(() => {
		const onScroll = () => setIsScrolled(window.scrollY > 16);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	// Debounced search update
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setSearchQuery(localSearchValue);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [localSearchValue, setSearchQuery]);

	const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalSearchValue(e.target.value);
	}, []);

	const handleClearSearch = useCallback(() => {
		setLocalSearchValue("");
		setSearchQuery("");
	}, [setSearchQuery]);

	return (
		<motion.header
			className="fixed left-0 right-0 top-0 z-40"
		>
			<div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-10">
				<Link href="/" className="flex items-center">
					<Image
						src="/logo.png"
						alt="Movigoo"
						width={120}
						height={40}
						priority
						className="object-contain h-8 w-auto md:h-9"
					/>
				</Link>


				{/* Desktop Search */}
				<div className="hidden flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 md:flex">
					<Search size={16} className="text-slate-400" />
					<Input
						value={localSearchValue}
						onChange={handleSearchChange}
						className="border-none bg-transparent p-0 text-sm text-white placeholder:text-slate-400"
						placeholder="Search concerts, sports, arts..."
					/>
					{localSearchValue && (
						<button
							onClick={handleClearSearch}
							className="rounded-full p-1 text-slate-400 hover:text-white transition"
							aria-label="Clear search"
						>
							<X size={14} />
						</button>
					)}
				</div>

				<DesktopNav onMoviesClick={handleMoviesClick} />

			<div className="hidden items-center gap-2 lg:flex">
				<Button variant="ghost" size="sm" className="h-10 w-10 rounded-full border border-white/10 p-0">
					<Bell size={18} />
				</Button>
				{user ? (
					<Button 
						variant="amber" 
						size="sm" 
						className="flex items-center gap-2 rounded-full px-4"
						onClick={() => router.push("/profile")}
					>
						<UserRound size={16} />
						<span>{user.displayName || user.email?.split("@")[0] || "Profile"}</span>
					</Button>
				) : (
					<Button 
						variant="amber" 
						size="sm" 
						className="flex items-center gap-2 rounded-full px-4"
						onClick={() => router.push("/profile")}
					>
						<UserRound size={16} />
						<span>Sign In</span>
					</Button>
				)}
			</div>

				{/* Mobile Search & Menu */}
				<div className="flex flex-1 items-center justify-end gap-2 lg:hidden">
					<Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="sm" className="rounded-full">
								<Search size={18} />
							</Button>
						</SheetTrigger>
						<SheetContent side="top" className="border-white/10 bg-slate-900/95 p-4">
							<div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
								<Search size={16} className="text-slate-400" />
								<Input
									value={localSearchValue}
									onChange={handleSearchChange}
									placeholder="Search concerts, sports, arts..."
									className="border-none bg-transparent p-0 text-white placeholder:text-slate-400"
									autoFocus
								/>
								{localSearchValue && (
									<button
										onClick={handleClearSearch}
										className="rounded-full p-1 text-slate-400 hover:text-white transition"
										aria-label="Clear search"
									>
										<X size={14} />
									</button>
								)}
							</div>
						</SheetContent>
					</Sheet>
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
										<Input
											value={localSearchValue}
											onChange={handleSearchChange}
											placeholder="Artist, city, genre..."
											className="border-none bg-transparent p-0 text-white placeholder:text-slate-400"
										/>
										{localSearchValue && (
											<button
												onClick={handleClearSearch}
												className="rounded-full p-1 text-slate-400 hover:text-white transition"
												aria-label="Clear search"
											>
												<X size={14} />
											</button>
										)}
									</div>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>

			{/* Movies Coming Soon Modal - Reused from MobileDock */}
			{showComingSoon && (
				<div 
					className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm"
					onClick={() => setShowComingSoon(false)}
				>
					<div 
						className="bg-slate-900 border border-white/10 rounded-3xl px-6 py-8 w-80 text-center animate-scaleIn shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mx-auto mb-5 w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center animate-reelSpin shadow-lg shadow-red-500/30">
							<span className="text-3xl">🎬</span>
						</div>

						<h3 className="text-xl font-bold text-white">Movies</h3>
						<p className="text-sm text-slate-400 mt-2">
							Coming Soon
						</p>

						<p className="text-xs text-slate-500 mt-3 leading-relaxed">
							We&apos;re bringing movie ticket booking & showtimes to Movigoo very soon. Stay tuned!
						</p>

						<button
							onClick={() => setShowComingSoon(false)}
							className="mt-6 px-6 py-2.5 rounded-xl bg-[#0B62FF] text-white text-sm font-semibold hover:bg-[#0A5AE6] transition-colors"
						>
							Got it
						</button>
					</div>
				</div>
			)}

			<style jsx global>{`
				@keyframes reelSpin {
					0% { transform: rotate(-10deg) scale(0.8); opacity: 0; }
					60% { transform: rotate(10deg) scale(1.05); opacity: 1; }
					100% { transform: rotate(0deg) scale(1); }
				}

				.animate-reelSpin {
					animation: reelSpin 0.5s ease-out;
				}

				@keyframes scaleIn {
					from { transform: scale(0.9); opacity: 0; }
					to { transform: scale(1); opacity: 1; }
				}

				.animate-scaleIn {
					animation: scaleIn 0.25s ease-out;
				}
			`}</style>
		</motion.header>
	);
};

export default Header;
