import { response } from "express";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const get_artifacts=(req,res=response)=>{

    const { id='' } = req.params;

    const artifact_dir = path.join(__dirname, `../public/arts/${id}`)


    fs.readdir(artifact_dir, (err, files)=>{
        if(err) return res.status(400).json({ok:false, msg:'Error reading files'});

        return res.status(200).json({ok:true, files});
    })
    
}


const upload_artifact = async(req,res=response) => {

    try {

        if(!req.file) return res.status(400).json({ok:false, msg:'No file'});

        return res.status(200).json({ok:true, msg:"Success"});
        
    } catch (error) {
        return res.status(400).json({msg:"Upload error"})
    }

};

export { get_artifacts, upload_artifact };