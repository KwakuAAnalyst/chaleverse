'use server';

import { connectToDatabase } from '@/lib/mongodb';
import Event from '@/database/event.model';


export const getSimilarEventsBySlug = async (slug: string) => {
    try {

        // connect to database
        await connectToDatabase();

        // fetch similar events based on slug
        const event = await Event.findOne({ slug });

        // Add null check - if event doesn't exist, return empty array
        if (!event) {
            return [];
        }

        // Now safely access event._id and event.tags
        const similarEvents = await Event.find({ 
            _id: { $ne: event._id }, 
            tags: { $in: event.tags } 
        })
        .limit(6) // Limit to 6 similar events for performance
        .lean(); // Convert to plain JavaScript objects

        // Convert MongoDB documents to plain objects with string IDs
        return similarEvents.map((event: any) => ({
            ...event,
            _id: event._id.toString(), // Convert ObjectId to string
            id: event._id.toString(),  // Add id field for React key
        }));
    } catch (error) {
        console.error('Error fetching similar events:', error);
        return [];
    }
};