export const defaultBullMQOptions = {
   attempts: 3,
   backoff: {
      type: 'exponential',
      delay: 2000
   },
   removeOnComplete: {
      age: 3600
   },
   removeOnFail: {
      age: 86400
   }
};
