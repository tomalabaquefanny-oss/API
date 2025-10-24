import { Router } from "express";
import {deleteUsuario, getUsuarios, getUsuariosxid, login, patchUsuario, postUsuario, putUsuario } from '../controladores/usuariosCtrl.js'
import { verifyToken } from "../jwt/verifytoken.js";
const router=Router()
//armar nuestras rutas

router.get('/usuarios', verifyToken, getUsuarios)//select 
router.get('/usuarios/:id', verifyToken, getUsuariosxid)//select con id
router.post('/usuarios', postUsuario)//insert
router.put('/usuarios/:id',putUsuario) //update
router.patch('/usuarios/:id', patchUsuario)
router.delete('/usuarios/:id', deleteUsuario)
router.post('/login', login)

export default router
