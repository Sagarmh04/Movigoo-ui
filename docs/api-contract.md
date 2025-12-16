# Movigoo API Contract

All requests use local Next.js API routes (no external URLs).

## GET /api/events

Query params: `page`, `city`, `category`, `q`, `date_from`, `date_to`, `sort`.

**Response**

```json
{
  "events": [
    {
      "id": "event-aurora",
      "slug": "aurora-chroma-live",
      "title": "Aurora Chroma Live Experience",
      "coverWide": "https://cdn.movigoo.com/aurora-wide.jpg",
      "coverPortrait": ["https://cdn.movigoo.com/aurora-portrait.jpg"],
      "city": "Mumbai",
      "venue": "NMACC Grand Theatre",
      "dateStart": "2025-08-12T19:00:00+05:30",
      "dateEnd": "2025-08-12T22:30:00+05:30",
      "categories": ["Music", "Immersive"],
      "rating": 4.9,
      "priceFrom": 3999,
      "description": "Live synesthetic concert.",
      "organizerId": "organizer-abc",
      "hosted": true
    }
  ],
  "total": 120,
  "page": 1,
  "pageSize": 12
}
```

## GET /api/events/:slug

**Response**

```json
{
  "event": { "...": "Event" },
  "ticketTypes": [
    {
      "id": "aurora-vip",
      "name": "VIP Infinity",
      "price": 8999,
      "available": 40,
      "maxPerOrder": 4,
      "perks": "Sky Lounge • Meet & Greet",
      "description": "Includes pre-show lounge"
    }
  ],
  "organizer": {
    "id": "organizer-abc",
    "name": "Aarav Kapoor",
    "role": "organizer",
    "email": "aarav@movigoo.com"
  }
}
```

## POST /api/bookings

**Body**

```json
{
  "eventId": "event-aurora",
  "items": [
    { "ticketTypeId": "aurora-vip", "quantity": 2, "price": 8999 },
    { "ticketTypeId": "aurora-gold", "quantity": 1, "price": 5999 }
  ],
  "userId": "organizer-abc",
  "paymentMethod": "card",
  "promoCode": "MAGICGOLD"
}
```

**Response**

```json
{
  "bookingId": "bk_4512",
  "status": "confirmed",
  "paymentUrl": null,
  "booking": {
    "bookingId": "bk_4512",
    "userId": "organizer-abc",
    "eventId": "event-aurora",
    "items": [
      { "ticketTypeId": "aurora-vip", "quantity": 2, "price": 8999 }
    ],
    "status": "confirmed",
    "totalAmount": 17998,
    "createdAt": "2025-05-18T10:00:00.000Z"
  }
}
```

### Error response

```json
{
  "message": "Selected ticket sold out"
}
```

## POST /api/payments/verify

**Body**

```json
{
  "bookingId": "bk_4512",
  "paymentProviderData": {}
}
```

**Response**

```json
{
  "status": "success",
  "booking": { "...": "Booking" }
}
```

## GET /api/bookings

`GET /api/bookings?userId=organizer-abc`

**Response**

```json
{
  "bookings": [
    {
      "bookingId": "bk_4512",
      "eventId": "event-aurora",
      "status": "confirmed",
      "items": [{ "ticketTypeId": "aurora-vip", "quantity": 2, "price": 8999 }],
      "totalAmount": 17998,
      "createdAt": "2025-05-18T10:00:00.000Z"
    }
  ]
}
```

## Admin: GET /api/admin/banners

Used to power the hero carousel.

```json
{
  "banners": [
    {
      "id": "banner-premier",
      "title": "Premium Cinematic",
      "subtitle": "Metaverse premieres in Dolby Vision",
      "image": "https://cdn.movigoo.com/banner1.png",
      "cta": "Book now"
    }
  ]
}
```

## Hosted event detection

The front-end treats any event where `event.organizerId === currentUser.id` as **hosted**. Hosted events render the glowing `HostedBadge`, a “Manage Event” CTA, and accent borders. Update the events payload to include `hosted: true` when possible to avoid additional checks on the client.

