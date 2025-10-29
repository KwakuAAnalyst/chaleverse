"use client";

import Link from "next/link";
import Image from "next/image";

interface Props {
    title: string;
    image?: string; // Make image optional to handle missing values
    slug: string;
    location: string;
    date: string;
    time: string;
}

const EventCard = ({ title, image, slug, location, date, time }: Props) => {
    // Validate and provide fallback for image
    const validImage = image && image.trim() !== '' ? image : '/images/event1.png';
    
    // Validate required props
    if (!title || !slug) {
        console.warn('EventCard: Missing required props (title or slug)');
        return null;
    }
    
    return (
       <Link href={`/events/${slug}`} id="event-card">
        <Image 
            src={validImage} 
            alt={title} 
            width={410} 
            height={300} 
            className="poster"
            // Add priority for above-the-fold images
            priority={false}
            // Add error handling for broken images
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/event1.png';
            }}
        />

        <div className="flex flex-row gap-2">
            <Image src="/icons/pin.svg" alt="location" width={14} height={14} />
            <p>{location}</p>
        </div>

        <p className="title">{title}</p>   

        <div className="datetime">
            <div className="flex flex-row gap-2">
                <Image src="/icons/calendar.svg" alt="calendar" width={14} height={14} />
                <p className="date">{date}</p>
            </div>

            <div className="flex flex-row gap-2">
                <Image src="/icons/clock.svg" alt="clock" width={14} height={14} />
                <p className="time">{time}</p>
            </div>
        </div>
       </Link>
    );
};

export default EventCard;
