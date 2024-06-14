import express from 'express';
import router from './routes/index';

const app = express();
const port = parseInt(process.env.PORT, 10) || 5000;

// load routes from the routes folder
app.use('/', router);

// start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
