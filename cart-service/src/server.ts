import  http from 'http';
import { app } from './app.js';
import { config } from './config/config.js';
import mongoose from 'mongoose';
const port = config.port || 8000;


mongoose.connect(config.mongodb.uri, {
    maxPoolSize: 10,
    minPoolSize:5
  }).then(() => {
    
    console.log('Connected to MongoDB');

    //Srart the Server
    const server = http.createServer(app); //pass in a listner

    server.on('listening', function () {
        console.log(`Server is Running on ${port}!`);
    }).on('error', function (err) {
        console.log('Server Error : ', err);
    }).on('end', function(err){
        console.log('Shutting down Server : ', err);
    });


    server.listen(port);
    server.timeout = 10000;

  })
  .catch((err) => console.error('MongoDB connection error:', err));


