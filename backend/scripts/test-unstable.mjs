import { unstable_dev } from 'wrangler';

async function main() {
    console.log("Starting unstable_dev...");
    const worker = await unstable_dev('src/index.ts', {
        experimental: { disableExperimentalWarning: true },
        local: true
    });
    
    console.log("Worker started!", worker.address, worker.port);
    
    let res = await worker.fetch('/api/sync/products');
    console.log("Status:", res.status);
    let text = await res.text();
    console.log("Response:", text.substring(0, 100));

    await worker.stop();
}

main().catch(e => { console.error(e); process.exit(1); });
