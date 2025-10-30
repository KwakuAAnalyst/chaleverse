import ExploreBtn from '@/components/ExploreBtn'
import React from 'react'
import EventCard from '@/components/EventCard'

import { events } from '@/lib/constants'
import { IEvent } from '@/database'
const Page = async () => {
    let events = [];
    
    try {
        // Use absolute URL for server-side fetching
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/events`, {
            // Add cache options for better performance
            cache: 'no-store', // Always fetch fresh data
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        const data = await response.json();
        events = data.events || [];
        console.log("Fetched events data:", events);
    } catch (error) {
        console.error("Error fetching events:", error);
        // Fallback to static events if API fails
        events = [];
    }

    return (
        <section>
            <h1 className="text-center">Create, Connect, Collaborate <br />in the ChaleVerse</h1>
            <p className="text-center mt-5">Family, Friends, and Festival Events, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7" id="events">
                <h3>Featured Events</h3>
                <p className="mt-2">Check out the latest events happening in the ChaleVerse.</p>

                <ul className="events">
                    {events && events.length > 0 && events.map((event: IEvent) => (
                        <li key={event.title} className='list-none'>
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div> 


        </section>
    )
}
export default Page
