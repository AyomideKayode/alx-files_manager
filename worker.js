// worker.js
import Bull from 'bull';
import { promises as fsPromises } from 'fs';
// import path from 'path';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.db
    .collection('files')
    .findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });
  if (!file) {
    throw new Error('File not found');
  }

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const thumbnail = await imageThumbnail(file.localPath, { width: size });
      // eslint-disable-next-line no-await-in-loop
      await fsPromises.writeFile(`${file.localPath}_${size}`, thumbnail);
    } catch (err) {
      console.error(`Error creating thumbnail for size ${size}:`, err);
    }
  }
});

fileQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

fileQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed:`, err);
});
