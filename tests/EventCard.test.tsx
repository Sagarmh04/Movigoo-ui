import { render, screen } from "@testing-library/react";
import EventCard from "@/components/EventCard";
import type { Event } from "@/types/event";

jest.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ user: { id: "organizer-abc", name: "Aarav", role: "organizer" } })
}));

const sampleEvent: Event = {
  id: "event-demo",
  slug: "demo",
  title: "Demo Event",
  coverWide: "/posters/aurora.svg",
  coverPortrait: [],
  city: "Mumbai",
  venue: "NMACC",
  dateStart: "2025-01-01T10:00:00+05:30",
  categories: ["Music"],
  rating: 4.8,
  priceFrom: 2999,
  description: "desc",
  organizerId: "organizer-abc"
};

describe("EventCard", () => {
  it("renders title and venue", () => {
    render(<EventCard event={sampleEvent} />);
    expect(screen.getByText("Demo Event")).toBeInTheDocument();
    expect(screen.getByText(/NMACC/)).toBeInTheDocument();
  });

  it("shows HostedBadge for organizer events", () => {
    render(<EventCard event={sampleEvent} />);
    expect(screen.getByText(/Hosted by you/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Event/i)).toBeInTheDocument();
  });
});

