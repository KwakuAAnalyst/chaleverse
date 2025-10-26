import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import Event from './event.model';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Booking schema definition
const BookingSchema: Schema<IBooking> = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      validate: {
        validator: async function(value: Types.ObjectId): Promise<boolean> {
          // Skip validation during initialization or if value is null/undefined
          if (!value) return false;
          
          try {
            const event = await Event.findById(value);
            return !!event;
          } catch (error) {
            return false;
          }
        },
        message: 'Referenced event does not exist',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function(value: string): boolean {
          // RFC 5322 compliant email validation
          const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
          return emailRegex.test(value);
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Pre-save hook to validate event existence and normalize email
 * Ensures referential integrity before saving booking
 */
BookingSchema.pre('save', async function(next) {
  const booking = this as IBooking;

  try {
    // Verify event exists if eventId is new or modified
    if (booking.isNew || booking.isModified('eventId')) {
      const eventExists = await Event.findById(booking.eventId);
      if (!eventExists) {
        const error = new Error('Cannot create booking: Event does not exist');
        return next(error);
      }
    }

    // Normalize email format
    if (booking.isModified('email')) {
      booking.email = booking.email.toLowerCase().trim();
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Create indexes for optimized queries
BookingSchema.index({ eventId: 1 }); // Faster lookups by event
BookingSchema.index({ email: 1 }); // Faster lookups by user email
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true }); // Prevent duplicate bookings

// Virtual populate to get event details
BookingSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true,
});

// Create and export the Booking model
const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
