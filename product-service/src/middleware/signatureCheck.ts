import  { Request, Response } from "express";
import{ createHmac, timingSafeEqual }  from 'crypto';
import { config } from '../config/config.js';


export default async function signatureCheck(req: Request, res: Response, next) {

    try{

        // Check if Service Signature Exists
        const hmacSignature: string = req.headers['service-identity'] as string;
        if(hmacSignature === undefined || hmacSignature == "")
            return res.status(403).json({ errors: "No Signature" });

        if(!hmacSignature.startsWith("HMAC "))
        return res.status(400).json({ errors: "No Signature value" });

        const providedSignature: string = hmacSignature.replace("HMAC ", "");

        //Check if the request time is still valid / avoid replay attack
        const timestamp = parseInt(req.headers['service-timerstamp'] as string);
        if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > Number( config.IPC_TIMEOUT) ) {
            console.error('Timestamp expired');
            return res.status(400).json({ errors: "TimeStamp" });
        }
        // Create the HMAC signature
        const payload = JSON.stringify({ message: config.IPC_PASSPHRASE });
        const expectedPayload = createHmac(config.HMAC_ALGORITHM, config.JWT_SECRET).update(payload).digest('hex');

        if( ! timingSafeEqual( Buffer.from(providedSignature), Buffer.from(expectedPayload)) )
            return res.status(403).json({ errors: "Signature Mismatch" });

        console.log("Signature matches !");
        next();

    }catch(err){

        console.log('/signatureCheck ', err);
        return res.status(500).json({
            error: true,
            message: "Error while Checking Service Signature"
        });

    }

}