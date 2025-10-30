import { notFound } from "next/navigation";
import Image from "next/image";
import { Book } from "lucide-react";
import BookEvent from "@/components/BookEvent";
import { IEvent } from "@/database";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import EventCard from "@/components/EventCard";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const EventDetailItem = ({ icon, alt, label }: { icon: string; alt: string; label: string }) => (
    <div className="flex flex-row gap-2 items-center mb-2">
        <Image src={icon} alt={alt} width={17} height={17} />
        <p>{label}</p>
    </div>
);

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
    agendaItems.length > 0 ? (
        <div className="agenda">
            <h2>Agenda</h2>
            <ul>
                {agendaItems.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </div>
    ) : null
);

const EventTags = ({ tags }: { tags: string[] }) => (
    <div className="flex flex-row gap-1.5 flex-wrap ">
        {tags.map((tag, index) => (
            <div className="pill" key={index}>{tag}</div>
        ))}
    </div>
);


const EventDetailsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    const request = await fetch(`${BASE_URL}/api/events/${slug}`, {
        next: { revalidate: 60 } // Optional: Add caching strategy
    });
    
    if (!request.ok) {
        return notFound();
    }
    
    const data = await request.json();
    
    if (!data.event) {
        return notFound();
    }
    
    const { description, image, overview, date, time, location, mode, agenda, audience, tags, organizer } = data.event;

    if(!description) return notFound();

    const bookings = 10; // Placeholder for bookings data

    const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);

    // Validate and provide fallback for image
    const validImage = image && image.trim() !== '' ? image : '/images/event1.png';

    // Parse agenda safely
    let parsedAgenda: string[] = [];
    try {
        if (agenda && Array.isArray(agenda) && agenda.length > 0) {
            if (typeof agenda[0] === 'string') {
                // Handle direct array format: ["item1", "item2", "item3"]
                parsedAgenda = agenda.filter((item: string) => item && item.trim() !== '');
            } else if (Array.isArray(agenda[0])) {
                // Handle nested array format: [["item1", "item2"]]
                parsedAgenda = agenda[0].filter((item: string) => item && item.trim() !== '');
            } else {
                parsedAgenda = agenda.flat().filter((item: string) => item && item.trim() !== '');
            }
        }
    } catch (error) {
        console.warn('Failed to parse agenda:', error);
        parsedAgenda = []; // Fallback to empty array
    }

    // Parse tags safely
    let parsedTags: string[] = [];
    try {
        if (tags && Array.isArray(tags) && tags.length > 0) {
            if (typeof tags[0] === 'string') {
                // Handle direct array format: ["tag1", "tag2", "tag3"]
                parsedTags = tags.filter((tag: string) => tag && tag.trim() !== '');
            } else if (Array.isArray(tags[0])) {
                // Handle nested array format: [["tag1", "tag2"]]
                parsedTags = tags[0].filter((tag: string) => tag && tag.trim() !== '');
            } else {
                parsedTags = tags.filter((tag: string) => tag && tag.trim() !== '');
            }
        }
    } catch (error) {
        console.warn('Failed to parse tags:', error);
        parsedTags = []; // Fallback to empty array
    }

    return (
        <section id="event">
            <div className="header">
                <h1>Event Description</h1>
                <p>{description}</p>
            </div>

            <div className="details">
            {/* Left Side - Event Content */}
            <div className="content">
                <Image 
                    src={validImage} 
                    alt="Event Banner" 
                    width={800} 
                    height={800} 
                    className="banner"
                />
            
                <section className="flex flex-col gap-2">
                    <h2>Overview</h2>
                    <p>{overview}</p>
                </section>
                
                <section className="flex flex-col gap-2">
                    <h2>Event Details</h2>

                    <EventDetailItem icon="/icons/calendar.svg" alt="calendar" label={date} />
                    <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
                    <EventDetailItem icon="/icons/pin.svg" alt="location" label={location} />
                    <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
                    <EventDetailItem icon="/icons/audience.svg" alt="audience" label={audience} />
                </section>

                <EventAgenda agendaItems={parsedAgenda} />

                <section className="flex flex-col gap-2">
                    <h2>About the Organizer</h2>
                    <p>{organizer}</p>
                </section>

                {parsedTags.length > 0 && <EventTags tags={parsedTags} />}
            </div>


            {/* Right Side - Booking Form */}
            <aside className="booking">
                <div className="signup-card">
                    <h2>Book Your Place at This Event</h2>
                    {bookings > 0 ? (
                        <p className="text-sm">
                            Join {bookings} people who have already booked their spot!
                        </p>
                    ) : (
                        <p className="text-sm">
                            Be the first to book your spot!
                        </p>
                    )}

                    <BookEvent />
                </div>

            </aside>
            </div>

            <div className="flex w-full flex-col gap-4 pt-20">
                <h2>Similar Events</h2>
                <div className="events">
                    {similarEvents.length > 0 && similarEvents.map((similarEvent: IEvent) => (
                        <EventCard key={similarEvent.id} {...similarEvent} />
                    ))}
                </div>
            </div>
            </section>
        );  
}

export default EventDetailsPage;
