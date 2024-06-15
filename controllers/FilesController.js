// controllers/FilesController.js

import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
// import mime from 'mime-types';

class FilesController {
  // Static method to handle file upload
  static async postUpload(req, res) {
    // Extract the token from the 'x-token' header
    const token = req.headers['x-token'];
    // Check if the token is missing
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' }); // respond with 401 and error message
    }

    // create a key for the token stored in Redis
    const tokenKey = `auth_${token}`;
    // Retrieve the user ID associated with the token from Redis
    const userId = await redisClient.get(tokenKey);

    // Check if no user ID was found for the provided token
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' }); // Respond with a 401 status and an error message
    }

    // Extract file details from the request body
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      // check if the file name is missing
      return res.status(400).json({ error: 'Missing name' }); // respond with 400 and error message
    }

    // check if the file type is missing or invalid
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' }); // respond with 400 and error message
    }

    // check if the file data is missing for non-folder types
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' }); // respond with 400 and error message
    }

    // check if the parent file exists and is a folder
    if (parentId !== 0) {
      const parentFile = await dbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(parentId) });
      // If parent file doesn't exist or is not a folder, respond with an error
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // create the file document to be inserted into the database
    const fileDocument = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId !== 0 ? ObjectId(parentId) : 0,
    };

    // If the type is 'folder', insert the document and return the response
    if (type === 'folder') {
      const result = await dbClient.db
        .collection('files')
        .insertOne(fileDocument);
      return res.status(201).json({ id: result.insertedId, ...fileDocument });
    }

    // If the type is not 'folder', handle file upload
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager'; // Set folder path from environment variable or default
    const localPath = path.join(folderPath, uuidv4()); // generate unique local path for file

    // create the folder if it doesn't exist
    await fsPromises.mkdir(folderPath, { recursive: true });
    // convert the base64 data to a buffer
    const fileData = Buffer.from(data, 'base64');

    // write the file to the local path
    await fsPromises.writeFile(localPath, fileData);

    // add the local path to the file document
    fileDocument.localPath = localPath;

    // insert the document into the database and return the response
    const result = await dbClient.db
      .collection('files')
      .insertOne(fileDocument);
    return res.status(201).json({ id: result.insertedId, ...fileDocument });
  }

  // Static method to handle fetching a specific file's details
  static async getShow(req, res) {
    // extract the token from the 'x-token' header
    const token = req.headers['x-token'];
    // Check if the token is missing
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' }); // respond with 401 and an error message
    }

    // create a key for the token stored in Redis
    const tokenKey = `auth_${token}`;
    // get the user ID linked with the token from Redis
    const userId = await redisClient.get(tokenKey);

    // check if no user ID was found for the provided token
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' }); // respond with 401 status and an error message
    }

    // Extract the file ID from the request parameters
    const fileId = req.params.id;
    // Search for the file in the database using the file ID and user ID
    const file = await dbClient.db
      .collection('files')
      .findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });

    // Check if no file was found
    if (!file) {
      return res.status(404).json({ error: 'Not found' }); // Respond with a 404 status and an error message
    }

    // Respond with a 200 status and the file details
    return res.status(200).json(file);
  }

  // Static method to handle listing files
  static async getIndex(req, res) {
    // Extract the token from the 'x-token' header
    const token = req.headers['x-token'];
    // Check if the token is missing
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' }); // Respond with a 401 status and an error message
    }

    // Create a key for the token stored in Redis
    const tokenKey = `auth_${token}`;
    // Retrieve the user ID associated with the token from Redis
    const userId = await redisClient.get(tokenKey);

    // Check if no user ID was found for the provided token
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' }); // Respond with a 401 status and an error message
    }

    // Extract parentId and page query parameters from the request
    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20; // Set the page size for pagination

    // Search for files in the database with the matching parentId and userId
    const files = await dbClient.db
      .collection('files')
      .aggregate([
        {
          $match: {
            parentId: parentId === '0' ? 0 : ObjectId(parentId),
            userId: ObjectId(userId),
          },
        },
        { $skip: page * pageSize }, // Skip the appropriate number of documents for pagination
        { $limit: pageSize }, // Limit the number of documents returned to the page size
      ])
      .toArray();

    // Respond with a 200 status and the list of files
    return res.status(200).json(files);
  }
}

// Export the FilesController class
export default FilesController;
