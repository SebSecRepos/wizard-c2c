
import { Router } from "express"; 
import multer from "multer";
import { validate_jwt } from "../middlewares/validate_jwt.mjs";
import { delete_artifact, get_artifacts, upload_artifact } from "../controllers/artifacts_controller.mjs";
import { getSafeUploadPath, sanitizeFilename } from "../Utils/santize_path.mjs";
import path from "path";
import { fileURLToPath } from "url";
import { checkAdmin } from "../middlewares/checkAdmin.mjs";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            const params = {...req.params};
            console.log(params);
            
            const {destination='utils'} = params;
            if(destination.includes('..') || destination.includes('/')  || destination.includes('\\') ) throw new Error('Ruta de destino inválida.')
            const safePath = getSafeUploadPath(destination, '../public/arts/');
            const upload_dir = path.join(__dirname, safePath);
            cb(null, upload_dir);
        } catch (err) {
            console.log(err);
            cb(err);
        }
    },
    filename: function (req, file, cb) {

        try {
            if(file.originalname.includes('..') || file.originalname.includes('/' || destination.includes('\\')) ) throw new Error('Ruta de destino inválida.')
            const safeName = sanitizeFilename(file.originalname);
            const finalName = path.basename(safeName);
            console.log(finalName);
            
            cb(null, finalName);
            
        } catch (error) {
            console.log(error);
        }
    }
    
});

const upload = multer({ storage: storage });

const artifacts_router = () => {
    const router = Router();

    router.use(validate_jwt);
    
    router.get('/get/:id', (req,res) => get_artifacts(req,res));
    router.post('/upload/:destination', (req,res, next) =>checkAdmin(req,res, next), upload.single("file"), (req,res) => upload_artifact(req,res));
    router.delete('/delete/:destination', (req,res, next) =>checkAdmin(req,res, next), (req,res) => delete_artifact(req,res));
    
    return router;
};

export default artifacts_router

