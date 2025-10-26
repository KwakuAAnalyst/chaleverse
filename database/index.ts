// Database models central export
// This file provides a single entry point for importing all database models

import Event, { IEvent } from './event.model';
import Booking, { IBooking } from './booking.model';

// Export models
export { Event, Booking };

// Export types for TypeScript consumers
export type { IEvent, IBooking };

// Default export for convenience
export default {
  Event,
  Booking,
};
