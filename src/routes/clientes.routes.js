import { Router } from "express";
import {
  obetenerClientes,
  getobetenerClientes,
  getClientesxId,
  postClientes,
  putClientes,
  patchClientes,
  deleteClientes
} from "../controladores/clientesCtrl.js";

import { verifyToken } from "../jwt/verifytoken.js"; // 🔐 Importamos el middleware de verificación

const router = Router();

// 🧩 Rutas protegidas con verifyToken
router.get("/clientes", verifyToken, getobetenerClientes); // obtener todos
router.get("/clientes/:id", verifyToken, getClientesxId);  // obtener por id

// 🔓 Rutas abiertas (puedes protegerlas también si quieres)
router.post("/clientes", verifyToken,postClientes);  // insertar
router.put("/clientes/:id",verifyToken, putClientes);  // actualizar completo
router.patch("/clientes/:id", verifyToken,patchClientes); // actualizar parcial
router.delete("/clientes/:id",verifyToken, deleteClientes); // eliminar

export default router;
