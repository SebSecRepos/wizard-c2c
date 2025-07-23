
import { Router } from "express"; 
import multer from "multer";
import { validate_jwt } from "../middlewares/validate_jwt.mjs";
import { get_artifacts, upload_artifact } from "../controllers/artifacts_controller.mjs";
import { getSafeUploadPath, sanitizeFilename } from "../Utils/santize_path.mjs";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            const userDir = req.params.destination || 'utils'; 
            const safePath = getSafeUploadPath(userDir, '../public/arts/');
            const upload_dir = path.join(__dirname, safePath);
            cb(null, upload_dir);
        } catch (err) {
            console.log(err);
            cb(err);
        }
    },
    filename: function (req, file, cb) {

        try {
            const safeName = sanitizeFilename(file.originalname);
            console.log(safeName);
            
            // Asegúrate de mantener la extensión si es necesario
            const ext = path.extname(safeName) || path.extname(safeName);
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
    router.post('/upload/:destination', upload.single("file"), (req,res) => upload_artifact(req,res));
    
    return router;
};

export default artifacts_router

