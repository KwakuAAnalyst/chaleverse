import ExploreBtn from '@/components/ExploreBtn'
import React from 'react'
import EventCard from '@/components/EventCard'

import { events } from '@/lib/constants'
const Page = () => {
    return (
        <section>
            <h1 className="text-center">Create, Connect, Collaborate <br />in the ChaleVerse</h1>
            <p className="text-center mt-5">Family, Friends, and Festival Events, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7" id="events">
                <h3>Featured Events</h3>
                <p className="mt-2">Check out the latest events happening in the ChaleVerse.</p>

                <ul className="events">
                    {events.map((event) => (
                        <li key={event.title}>
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div> 


        </section>
    )
}
export default Page
