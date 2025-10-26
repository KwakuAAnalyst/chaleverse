import mongoose from 'mongoose';

// Define the connection type for better type safety
type ConnectionObject = {
  isConnected?: number;
};

// Cache the connection to prevent multiple connections during development
const connection: ConnectionObject = {};

/**
 * Establishes a connection to MongoDB using Mongoose
 * Implements connection caching to prevent multiple connections in development
 * @returns Promise<void>
 */
async function connectToDatabase(): Promise<void> {
  // Check if we already have a connection to the database
  if (connection.isConnected) {
    console.log('Already connected to database');
    return;
  }

  // Get the MongoDB URI from environment variables
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  try {
    // Attempt to connect to the database
    const db = await mongoose.connect(MONGODB_URI, {
      // Modern Mongoose doesn't require these options, but you can add them if needed
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    // Set the connection state
    connection.isConnected = db.connections[0].readyState;

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    
    // Exit the process with failure code in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error;
  }
}

/**
 * Disconnects from the MongoDB database
 * Useful for cleanup in serverless environments or testing
 * @returns Promise<void>
 */
async function disconnectFromDatabase(): Promise<void> {
  if (connection.isConnected) {
    await mongoose.disconnect();
    connection.isConnected = 0;
    console.log('Disconnected from MongoDB');
  }
}

/**
 * Gets the current connection status
 * @returns boolean - true if connected, false otherwise
 */
function isConnected(): boolean {
  return connection.isConnected === 1;
}

/**
 * Enhanced connection function with retry logic
 * Useful for production environments where network issues might occur
 * @param retries - Number of retry attempts (default: 3)
 * @param delay - Delay between retries in milliseconds (default: 5000)
 * @returns Promise<void>
 */
async function connectWithRetry(retries: number = 3, delay: number = 5000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await connectToDatabase();
      return;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      console.log(`Retrying connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Event listeners for connection state changes
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
  console.error('Mongoose connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  connection.isConnected = 0;
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

// Export the connection functions
export {
  connectToDatabase,
  disconnectFromDatabase,
  connectWithRetry,
  isConnected,
};

// Default export for convenience
export default connectToDatabase;
