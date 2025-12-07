import HomeLanding from "@/components/home/HomeLanding";

// Static/mock events removed - now using only hosted events from Firestore
// See components/HostedEventListClient.tsx for the client component that loads hosted events

export default async function HomePage() {
  // Home page now uses client component that loads hosted events from Firestore
  // This ensures only hosted events are displayed
  return <HomeLanding featuredEvents={[]} />;
}

