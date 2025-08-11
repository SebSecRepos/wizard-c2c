import { response } from "express";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import { getSafeUploadPath } from "../Utils/santize_path.mjs";
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


const get_buckets=async(req, res=response)=>{
  const targetDir = path.join(__dirname, '../public/arts');
  try {

    fs.readdir(targetDir, (err, files)=>{
        return res.json({ ok:true, items: files });
    })

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, msg: 'Error al traer buckets' });
  }

}
const create_bucket=async(req, res)=> {
    console.log(req.body);
    try {
        let { name="" } = req.body;
        
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ msg: 'Forbidden bucket name' });
    }

    if (
        name.includes('/') || 
        name.includes('\\') || 
        name.includes('..') ||
        name.includes('//') || 
        name.includes('\\\\') || 
        name.includes('....//') ||
        name.includes('....\\\\') 
    ) {
      return res.status(400).json({ ok:false, msg: 'Forbidden bucket name' });
    }

    name = path.basename(name);

    const basePath = path.join(__dirname, '../public/arts');
    const newDirPath = path.join(basePath, name);

    if (fs.existsSync(newDirPath)) {
        return res.status(400).json({ ok: false, msg: "Bucket already exists" });
    }

    // Crear carpeta
    fs.mkdir(newDirPath, { recursive: true }, (err) => {
        if (err) {
            console.error(err);
            return res.status(400).json({ ok: false, msg: err.message });
        }
        return res.status(200).json({ 
            ok: true, 
            message: 'Bucket has been created', 
        });
    });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: err.message });
  }
}


const delete_bucket = async (req, res) => {
  try {
    let { name = "" } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ ok: false, msg: 'Forbidden Bucket name' });
    }

    if (
      name.includes('/') ||
      name.includes('\\') ||
      name.includes('..') ||
      name.includes('//') ||
      name.includes('\\\\') ||
      name.includes('....//') ||
      name.includes('....\\\\')
    ) {
      return res.status(400).json({ ok: false, msg: 'Forbidden Bucket name' });
    }

    name = path.basename(name);

    const basePath = path.join(__dirname, '../public/arts');
    const dirPath = path.join(basePath, name);

    if (!fs.existsSync(dirPath)) {
      return res.status(404).json({ ok: false, msg: 'Bucket does not exist' });
    }

    fs.rm(dirPath, { recursive: true, force: true }, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ ok: false, msg: err.message });
      }
      return res.status(200).json({
        ok: true,
        message: 'Bucket has been deleted',
      });
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: err.message });
  }
};




export { get_artifacts, upload_artifact, delete_artifact, get_buckets, create_bucket, delete_bucket };