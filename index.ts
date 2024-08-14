import express, { Application } from 'express';
import mongoose from 'mongoose';
import { json } from 'body-parser';

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(json());


mongoose.connect('mongodb://localhost:27017/backend-challenge').then(() => {
  console.log('Connected to MongoDB'); //improve this with a logger
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((err: any) => {
  console.error('Error connecting to MongoDB', err);
});