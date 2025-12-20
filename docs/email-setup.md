# MSG91 Email Setup

This document describes how to configure MSG91 transactional emails for ticket confirmations.

## Environment Variables

Add these variables to your `.env.local` file (or production environment):

```bash
# MSG91 Email Configuration
MSG91_EMAIL_API_KEY=your_msg91_api_key_here
MSG91_EMAIL_SENDER=tickets@movigoo.in
MSG91_EMAIL_TEMPLATE_ID=MOVIGOO_FINAL_TICKET

# App URL (for ticket links in emails)
NEXT_PUBLIC_APP_URL=https://movigoo.in
```

## How It Works

1. **After Successful Booking**: When a booking is successfully saved to Firestore, the system automatically sends a ticket confirmation email.

2. **Non-Blocking**: Email sending is asynchronous and non-blocking. If email fails, the booking still succeeds.

3. **Email Template Variables**: The MSG91 template should support these variables:
   - `name` - User's name
   - `eventName` - Event title
   - `eventDate` - Formatted event date (e.g., "Monday, 15 January 2025")
   - `venue` - Venue name
   - `ticketQty` - Number of tickets
   - `bookingId` - Unique booking ID
   - `ticketLink` - Direct link to view ticket

## Testing

1. Create a test booking
2. Verify email arrives at the user's email address
3. Check that all template variables render correctly
4. Verify the ticket link works

## Error Handling

- Email failures are logged but never throw errors
- Booking succeeds even if MSG91 is unreachable
- Missing configuration is logged as a warning

## Security

- All MSG91 credentials are server-side only
- Never exposed to client-side code
- API keys stored in environment variables

