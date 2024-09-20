import  { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export default async function secured(req: Request, res: Response, next) {
        
    //check if no auth token
    if (req.headers["authorization"] == undefined) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    console.log(req.headers["authorization"]);
    let token: string = req.headers["authorization"].replace("Bearer ", "");
    console.log('authorization ', token);
    if (token == null)
        return res.status(400).json({
            message: "auth token missing"
        });

    //get user via auth token
    try{

            jwt.verify(token, config.JWT_SECRET, (err: any, user: any) => {
                console.log('ERROR: ',err)

                if (err)
                    return res.status(400).json({
                        message: "invalid token"
                    });
                
                console.log("User Data: ", user);
                req.user = user
                next();

            });

    }catch(err){

        console.log('/secured ', err);
        return res.status(500).json({
            error: true,
            message: "Error while authenticating user"
        });

    }


};