// controllers/UsersController.js
import sha1 from 'sha1';
import dbClient from '../utils/db';
// import { ObjectId } from 'mongodb';

class UsersController {
  // Method to handle the creation of a new user
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check if email is missing
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    // Check if password is missing
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if user with the same email already exists
    const existingUser = await dbClient.db
      .collection('users')
      .findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password using sha1 algorithm
    const hashedPassword = sha1(password);

    // Insert the new user into the database
    const result = await dbClient.db
      .collection('users')
      .insertOne({ email, password: hashedPassword });

    // Return the created user's id and email
    return res.status(201).json({ id: result.insertedId, email });
  }
}

export default UsersController;
