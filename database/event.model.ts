import mongoose, { Document, Model, Schema } from 'mongoose';

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Event schema definition
const EventSchema: Schema<IEvent> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    overview: {
      type: String,
      required: [true, 'Event overview is required'],
      trim: true,
      maxlength: [500, 'Overview cannot exceed 500 characters'],
    },
    image: {
      type: String,
      required: [true, 'Event image is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Event venue is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Event date is required'],
      validate: {
        validator: function(value: string): boolean {
          // Validate ISO date format (YYYY-MM-DD)
          return /^\d{4}-\d{2}-\d{2}$/.test(value);
        },
        message: 'Date must be in ISO format (YYYY-MM-DD)',
      },
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
      validate: {
        validator: function(value: string): boolean {
          // Validate time format (HH:MM AM/PM)
          return /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(value);
        },
        message: 'Time must be in format HH:MM AM/PM',
      },
    },
    mode: {
      type: String,
      required: [true, 'Event mode is required'],
      enum: {
        values: ['online', 'offline', 'hybrid'],
        message: 'Mode must be either online, offline, or hybrid',
      },
    },
    audience: {
      type: String,
      required: [true, 'Event audience is required'],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, 'Event agenda is required'],
      validate: {
        validator: function(value: string[]): boolean {
          return value.length > 0;
        },
        message: 'Agenda must contain at least one item',
      },
    },
    organizer: {
      type: String,
      required: [true, 'Event organizer is required'],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, 'Event tags are required'],
      validate: {
        validator: function(value: string[]): boolean {
          return value.length > 0;
        },
        message: 'Tags must contain at least one item',
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
 * Pre-save hook to generate URL-friendly slug from title and normalize date/time
 * Only regenerates slug if title has changed
 */
EventSchema.pre('save', function(next) {
  const event = this as IEvent;

  // Generate slug only if title is new or modified
  if (event.isNew || event.isModified('title')) {
    event.slug = event.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  // Normalize date to ISO format if modified
  if (event.isModified('date')) {
    const dateObj = new Date(event.date);
    if (!isNaN(dateObj.getTime())) {
      event.date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
  }

  // Normalize time format if modified
  if (event.isModified('time')) {
    // Ensure consistent time format (HH:MM AM/PM)
    const timeRegex = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i;
    const match = event.time.toUpperCase().match(timeRegex);
    if (match) {
      const [, hours, minutes, meridiem] = match;
      const formattedHours = hours.padStart(2, '0');
      event.time = `${formattedHours}:${minutes} ${meridiem}`;
    }
  }

  next();
});

// Create unique index on slug for better performance
EventSchema.index({ slug: 1 }, { unique: true });

// Additional indexes for common queries
EventSchema.index({ date: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ mode: 1 });

// Create and export the Event model
const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
