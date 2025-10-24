import { Router } from "express";
import multer from 'multer';
import upload from '../middlewares/upload.js'
import {
    getProductos, 
    getproductosxid,
    postProducto,
    putProducto,
    patchProducto,
    deleteProducto
} from '../controladores/productosCtrl.js';

import { verifyToken } from "../jwt/verifytoken.js"; // 🔐 importa el middleware

// Configurar multer para almacenar las imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // carpeta donde se guardan las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const uploads = multer({ storage });
const router = Router();

// 🧩 Rutas protegidas con verifyToken
router.get('/productos', verifyToken, getProductos);       // select
router.get('/productos/:id', verifyToken, getproductosxid); // select por id

// 🔓 Rutas abiertas (puedes protegerlas también si quieres)
router.post('/productos', verifyToken, upload.single('prod_imagen'), postProducto);  // insert
router.put('/productos/:id',verifyToken, upload.single('prod_imagen'), putProducto);   // update
router.patch('/productos/:id',verifyToken, patchProducto);  // update parcial
router.delete('/productos/:id', verifyToken, deleteProducto); // delete

export default router;
