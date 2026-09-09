import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

async function testConnection() {
  const varsPath = fs.existsSync('./.env') ? './.env' : './.dev.vars';
  let uri = '';
  if (fs.existsSync(varsPath)) {
    const content = fs.readFileSync(varsPath, 'utf8');
    const matchUri = content.match(/MONGODB_URI=(.*)/);
    if (matchUri) uri = matchUri[1].trim();
  }

  if (!uri) {
    console.error('No MONGODB_URI found.');
    process.exit(1);
  }

  console.log(`Attempting to connect to: ${uri.replace(/:([^:@]+)@/, ':****@')}`);
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    const db = client.db('cafe');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
  } catch (err: any) {
    console.error('❌ Failed to connect to MongoDB Atlas!');
    console.error(err.message);
  } finally {
    await client.close();
  }
}

testConnection();
