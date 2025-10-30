'use client';

import { useState } from "react";
const BookEvent = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setTimeout(() => {
            setSubmitted(true);
        }, 1000);
    };

    
    return (
        <div id="book-event">
            {submitted ? (
                <p className="text-sm">Thank you for booking! A confirmation email has been sent to {email}.</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email Address:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email address"
                        />
                    </div>
                    <button type="submit" className="button-submit">Book Now</button>
                </form>
            )}
        </div>
    );
}
export default BookEvent;