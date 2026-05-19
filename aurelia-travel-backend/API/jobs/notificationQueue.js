const { Queue } = require('bullmq');

// BullMQ uses these exact connection details to talk to Redis Labs
const connection = {
    host: 'redis-11990.c14.us-east-1-3.ec2.cloud.redislabs.com',
    port: 11990,
    username: 'default',
    password: 'OTTHFaLuIOjMNgaBw9bkJfOvlhVX0rJj'
};

// Create the Queue
const notificationQueue = new Queue('notification-queue', { connection });

console.log("📦 Notification Queue Initialized");

module.exports = notificationQueue;