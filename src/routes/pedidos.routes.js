import { Router } from "express";
import {getPedidos, getPedidoById,postPedido} from "../controladores/pedidosCtrl.js";

import { verifyToken } from "../jwt/verifytoken.js"; //  Importamos el middleware de verificación

const router = Router();

//Rutas abiertas (puedes protegerlas también si quieres)
router.post("/pedidos", verifyToken,postPedido);  // insertar
router.get("/pedidos", getPedidos);        // listar todos
router.get("/pedidos/:id", getPedidoById); // obtener uno por ID


export default router;
