import { Throttle } from '@nestjs/throttler';

// Strictly throttle requests to 1 per second, for auth, payment
export const StrictThrottle = () =>
  Throttle({
    default: {
      ttl: 1000,
      limit: 1,
    },
  });

// Moderately throttle requests to 5 per 10 seconds, for general use, crud
export const ModerateThrottle = () =>
  Throttle({
    default: {
      ttl: 1000,
      limit: 3,
    },
  });

// Leniently throttle requests to 10 per 60 seconds, for logging, etc
export const RelaxedThrottle = () =>
  Throttle({
    default: {
      ttl: 60000,
      limit: 10,
    },
  });
