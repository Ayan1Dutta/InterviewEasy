import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config();

export const connectToDatabase = async () =>{
    mongoose.connect(process.env.MONGO_URI).then(()=>{
        console.log("Connected to MongoDB");
    }).catch((err)=>{
        console.error("Error Connecting to MongoDB:",err.message);
    })
} 
