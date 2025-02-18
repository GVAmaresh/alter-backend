import { Request, Response } from "express";

export const emailPasswordVerify = async(req:Request, res: Response) =>{
    try{
        const {email, password, confirmPassword} = req.body
        
    }catch(err: any){
        console.error("Error verifying Email Password", err)
        res.status(500).json({message: "Internal Server Error"})
    }
}