export type TicketType = {
  id: string;
  name: string;
  price: number;
  available: number;
  maxPerOrder: number;
  perks: string;
  description?: string;
};

export type Event = {
  id: string;
  slug: string;
  title: string;
  coverWide: string;
  coverPortrait: string[];
  city: string;
  venue: string;
  venueMapLink?: string;
  dateStart: string;
  dateEnd?: string;
  categories: string[];
  rating?: number;
  priceFrom: number;
  description: string;
  organizerId: string;
  organizerName?: string;
  hosted?: boolean;
};

