import { response } from "express";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import { getSafeUploadPath } from "../Utils/santize_path.mjs";
import { ok } from "assert";
import { unlink } from "fs/promises";

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


const delete_artifact = async(req,res=response) => {

    try {
            
            const {destination=''} = req.params; 
            const {filename=''} = req.body;

            const test_dir = path.join(__dirname, `../public/arts/`);
            
            if(destination.includes('..') || destination.includes('/') || destination.includes('\\') ) return res.status(400).json({ok:false, msg:'Ruta de destino inválida.'});
            if(filename.includes('..') || filename.includes('/') || filename.includes('\\') ) return res.status(400).json({ok:false, msg:'Nombre de archivo inválido.'});
           
            fs.readdir(test_dir, (err, files)=>{
                if( !files.includes(destination)) return res.status(400).json({ok:false, msg:'Invalid path'});

            })

            const safePath = getSafeUploadPath(destination, '../public/arts');
            const filepath = path.join(__dirname, safePath, filename);

            try {
                await unlink(filepath);
                return res.status(200).json({ok:true, msg:'Eliminado'});
            } catch (error) {
                console.log(error);
                return res.status(400).json({ok:false, msg:'Error al eliminar'});
            }

    } catch (error) {
        console.log(error);
        return res.status(400).json({msg:"Upload error"})
    }

};

export { get_artifacts, upload_artifact, delete_artifact };