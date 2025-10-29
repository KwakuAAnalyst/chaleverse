import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import Event from "@/database/event.model";
import { IEvent } from "@/database";

// Define the route params type for better type safety
interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/events/[slug]
 * Retrieves a single event by its slug
 */
export async function GET(
  req: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    // Connect to database
    await connectToDatabase();

    // Extract and validate slug parameter
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { 
          message: "Slug parameter is required",
          error: "Missing slug in URL path" 
        },
        { status: 400 }
      );
    }

    // Validate slug format (URL-friendly string)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { 
          message: "Invalid slug format",
          error: "Slug must contain only lowercase letters, numbers, and hyphens" 
        },
        { status: 400 }
      );
    }

    // Query event by slug
    const event = await Event.findOne({ slug }).lean();

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        { 
          message: "Event not found",
          error: `No event found with slug: ${slug}` 
        },
        { status: 404 }
      );
    }

    // Return successful response with event data
    return NextResponse.json(
      {
        message: "Event retrieved successfully",
        event
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Event retrieval error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // MongoDB connection errors
      if (error.message.includes('connection')) {
        return NextResponse.json(
          { 
            message: "Database connection failed",
            error: "Unable to connect to database" 
          },
          { status: 503 }
        );
      }

      // MongoDB query errors
      if (error.name === 'CastError') {
        return NextResponse.json(
          { 
            message: "Invalid query parameter",
            error: "Malformed database query" 
          },
          { status: 400 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      {
        message: "Failed to retrieve event",
        error: error instanceof Error ? error.message : "Unknown server error"
      },
      { status: 500 }
    );
  }
}
