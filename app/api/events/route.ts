import { v2 as cloudinary } from "cloudinary";
import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import Event from "@/database/event.model";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        // Validate Cloudinary configuration
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return NextResponse.json({ 
                message: "Cloudinary configuration missing. Please check environment variables." 
            }, { status: 500 });
        }

        await connectToDatabase();

        const formData = await req.formData();

        // Extract and validate image file first
        const file = formData.get("image") as File;
        if (!file) {
            return NextResponse.json({ message: "Image file is required" }, {
                status: 400
            });
        }

        // Parse form data with proper array handling
        let eventData: any = {};
        
        try {
            // Handle regular fields
            for (const [key, value] of formData.entries()) {
                if (key !== "image") {
                    // Handle array fields (agenda and tags)
                    if (key === "agenda" || key === "tags") {
                        if (!eventData[key]) {
                            eventData[key] = [];
                        }
                        // Split comma-separated values or handle multiple entries
                        if (typeof value === "string") {
                            const items = value.split(",").map(item => item.trim()).filter(Boolean);
                            eventData[key] = [...eventData[key], ...items];
                        }
                    } else {
                        eventData[key] = value;
                    }
                }
            }

            // Validate required fields
            const requiredFields = ['title', 'description', 'overview', 'venue', 'location', 'date', 'time', 'mode', 'audience', 'organizer'];
            const missingFields = requiredFields.filter(field => !eventData[field]);
            
            if (missingFields.length > 0) {
                return NextResponse.json({ 
                    message: `Missing required fields: ${missingFields.join(', ')}` 
                }, { status: 400 });
            }

            // Ensure agenda and tags are arrays with at least one item
            if (!eventData.agenda || eventData.agenda.length === 0) {
                return NextResponse.json({ 
                    message: "Agenda must contain at least one item" 
                }, { status: 400 });
            }
            
            if (!eventData.tags || eventData.tags.length === 0) {
                return NextResponse.json({ 
                    message: "Tags must contain at least one item" 
                }, { status: 400 });
            }

        } catch (e) {
            return NextResponse.json({ message: "Invalid form data format" }, {
                status: 400
            });
        }

        // Upload image to Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "events",
                    resource_type: "image",
                    transformation: [
                        { width: 800, height: 600, crop: "fill" },
                        { quality: "auto" }
                    ]
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        return reject(new Error(`Image upload failed: ${error.message}`));
                    }
                    resolve(result);
                }
            ).end(buffer);
        });

        // Set the image URL (fixing field name mismatch)
        eventData.image = (uploadResult as { secure_url: string }).secure_url;

        // Create event in database
        const createdEvent = await Event.create(eventData);

        return NextResponse.json({ 
            message: "Event created successfully", 
            event: createdEvent 
        }, {
            status: 201,
        });

    } catch (e) {
        console.error("Event creation error:", e);
        
        // Handle specific error types
        if (e instanceof Error) {
            // Mongoose validation errors
            if (e.name === 'ValidationError') {
                return NextResponse.json({ 
                    message: "Validation failed", 
                    error: e.message 
                }, { status: 400 });
            }
            
            // Duplicate key errors (e.g., slug already exists)
            if (e.message.includes('duplicate key')) {
                return NextResponse.json({ 
                    message: "Event with this title already exists", 
                    error: "Duplicate event title" 
                }, { status: 409 });
            }
            
            // Cloudinary upload errors
            if (e.message.includes('Image upload failed')) {
                return NextResponse.json({ 
                    message: "Image upload failed", 
                    error: e.message 
                }, { status: 500 });
            }
        }
        
        return NextResponse.json({ 
            message: "Event creation failed", 
            error: e instanceof Error ? e.message : "Unknown error occurred" 
        }, {
            status: 500,
        });
    }
}

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const mode = searchParams.get('mode') || '';
        const tags = searchParams.get('tags') || '';

        // Build query filters
        const query: any = {};

        // Search by title, description, or location
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { organizer: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by mode
        if (mode && ['online', 'offline', 'hybrid'].includes(mode)) {
            query.mode = mode;
        }

        // Filter by tags
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get events with pagination
        const events = await Event.find(query)
            .sort({ date: 1, createdAt: -1 }) // Sort by date ascending, then newest first
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance

        // Get total count for pagination
        const totalEvents = await Event.countDocuments(query);
        const totalPages = Math.ceil(totalEvents / limit);

        return NextResponse.json({
            message: "Events retrieved successfully",
            events,
            pagination: {
                currentPage: page,
                totalPages,
                totalEvents,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit
            }
        }, {
            status: 200,
        });

    } catch (e) {
        console.error("Events retrieval error:", e);
        return NextResponse.json({
            message: "Failed to retrieve events",
            error: e instanceof Error ? e.message : "Unknown error occurred"
        }, {
            status: 500,
        });
    }
}