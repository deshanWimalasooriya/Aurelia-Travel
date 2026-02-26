const { Worker } = require('bullmq');

const connection = {
    host: 'redis-11990.c14.us-east-1-3.ec2.cloud.redislabs.com',
    port: 11990,
    username: 'default',
    password: 'OTTHFaLuIOjMNgaBw9bkJfOvlhVX0rJj'
};

// The worker listens to the queue and processes jobs
const worker = new Worker('notification-queue', async job => {
    
    if (job.name === 'send-welcome-email') {
        const { email, name } = job.data;
        console.log(`[WORKER] ✉️ Starting to send Welcome Email to ${name} (${email})...`);
        
        // We use a timeout to simulate a slow task (like sending an email via Gmail)
        await new Promise(resolve => setTimeout(resolve, 3000)); 
        
        console.log(`[WORKER] ✅ Email successfully sent to ${email}!`);
    }

}, { connection });

worker.on('completed', job => {
    console.log(`[QUEUE] Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.error(`[QUEUE] Job ${job.id} failed: ${err.message}`);
});

console.log("👷 Notification Worker Started in the background");

module.exports = worker;