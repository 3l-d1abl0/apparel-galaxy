import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';



function generateToken(user){

    try{

        // Define a secret key for signing the token (should be securely stored)
        const secretKey = config.JWT_SECRET

        // Calculate current time and expiration time
        const currentTime:number = Math.floor(Date.now() / 1000); // in seconds
        const expireTime:number = currentTime + (Number(config.JWT_EXPIRATION_TIME_MINUTES) * 60); // 10 minutes in seconds

        // Example payload with an additional 'expire' field
        const payload ={
            sub: user.email,
            role: user.role,
        }

        // Generate JWT token with an expiration time of 10 minutes
        const token = jwt.sign(payload, secretKey, { expiresIn: `${config.JWT_EXPIRATION_TIME_MINUTES}m` });

        return token;

    }catch(error){
        console.log('ERROR while generating tokens: ', error);
        return null;
    }
}

export function getAdminToken() {
    const user = {
        email: "test_user@apparelgalaxy.com",
        role: 0
    };


    return generateToken(user);
}

export function getNormalToken() {
    const user = {
        email: "test_user@example",
        role: 1
    };

    return generateToken(user);
}
