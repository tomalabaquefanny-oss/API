import {conmysql} from '../db.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const getUsuarios=
async (req,res)=>{
    try {
        const [result] = await conmysql.query(' select * from usuarios ')
        res.json(result)
    } catch (error) {
        return res.status(500).json({message:"Error al consultar usuarios"})
    }
}

export const getUsuariosxid=
async (req,res)=>{
    try {
        const[result]=await conmysql.query('select * from usuarios where usr_id=?',[req.params.id])
        if (result.length<=0)return res.status(404).json({
            cli_id:0,
            message:"Usuario no encontrado"
        })
        res.json(result[0])
    } catch (error) {
        return res.status(500).json({message:'error de lado del servidor'})        
    }
}

export const postUsuario=
async (req,res)=>{
    try {
    //console.log(req.body)
    const {usr_usuario, usr_clave, usr_nombre, usr_telefono, usr_correo, usr_activo}=req.body
    //console.log(cli_nombre) Se paracion la parte del cliente que queramos
    const saltRounds = 10;
    //const hashedPassword = await bcrypt.hash(usr_clave, saltRounds); 
    const [rows] = await conmysql.query('insert into usuarios (usr_usuario, usr_clave, usr_nombre, usr_telefono, usr_correo, usr_activo) values(?,?,?,?,?,?)',
        [usr_usuario, usr_clave, usr_nombre, usr_telefono, usr_correo, usr_activo])
        // const [rows]=await conmysql2.query('insert into tabla(cam1,cam2)values(?,?)', [cli_nombre, cli_usr_usuario]) Eso es un ejemplo una estructura que si deseas nomas querer
    res.send({
        id:rows.insertId
    })
    } catch(error){
            return res.status(500).json({message:'error del lado del servidor'})
    }
    
}

export const login = async (req, res) => {
    try {
        const { usr_usuario, usr_clave } = req.body;
        
        // Validacion del usuario y contraseña
        if (!usr_usuario || !usr_clave) {
            return res.status(400).json({ 
                message: "Usuario y contraseña son requeridos" 
            });
        }

        // Buscar usuario
        const [rows] = await conmysql.query(
            'SELECT * FROM usuarios WHERE usr_usuario = ?', [usr_usuario]);
        if (rows.length === 0) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }
        const usuario = rows[0];
        let contrasenaValida = false;

        // Verificar contraseña tanto que este hasheada como no hasheada
        if (usuario.usr_clave.startsWith('$2a$')) {
            contrasenaValida = await bcrypt.compare(usr_clave, usuario.usr_clave);
        } else {
            contrasenaValida = usr_clave === usuario.usr_clave;
            
            // Si la contraseña no estaba hasheada, hashearla ahora
            if (contrasenaValida) {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(usr_clave, salt);
                await conmysql.query(
                    'UPDATE usuarios SET usr_clave = ? WHERE usr_id = ?',
                    [hash, usuario.usr_id]
                );
            }
        }

        if (!contrasenaValida) {
            return res.status(401).json({ 
                message: "Credenciales inválidas" 
            });
        }

        // Generar token
        const token = jwt.sign(
            {id: usuario.usr_id,},
            process.env.JWT_SECRET || 'tu_secreto_super_seguro',
            { expiresIn: '1h' }
        );

         // Enviar el token y el id del usuario en la respuesta
        res.status(200).json({ auth: true, token, usr_id: usuario.usr_id });
        
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ 
            message: "Error al iniciar sesión",
            error: error.message 
        });
    }
};

export const putUsuario=
async (req,res)=>{
    try {
        const {id}=req.params
        const {usr_usuario, usr_clave, usr_nombre, usr_telefono, usr_correo, usr_activo}=req.body
        const [result]=await conmysql.query('update usuarios set usr_usuario=?, usr_clave=?, usr_nombre=?, usr_telefono=?, usr_correo=?, usr_activo=? where usr_id=?',
            [usr_usuario, usr_clave, usr_nombre, usr_telefono, usr_correo, usr_activo, id])
        if(result.affectedRows<=0)return res.status(404).json({
            message:'Usuario no encontrado'
        })
        const[rows]=await conmysql.query('select * from usuarios where usr_id=?',[id])
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({message:'error del lado del servidor'})
    }
}

export const patchUsuario = async (req, res) => {
    try {
        const {id} = req.params
        const {usr_usuario,usr_clave, usr_nombre, usr_telefono, usr_correo, usr_activo} = req.body
        
        const [result] = await conmysql.query(
            'UPDATE Usuarios SET usr_usuario = IFNULL(?, usr_usuario), usr_clave = IFNULL(?, usr_clave), usr_nombre = IFNULL(?, usr_nombre), usr_telefono = IFNULL(?, usr_telefono), usr_correo = IFNULL(?, usr_correo), usr_activo = IFNULL(?, usr_activo)  WHERE usr_id = ?',
            [usr_usuario, usr_clave, usr_nombre, usr_telefono, usr_correo, usr_activo, id]
        )

        if(result.affectedRows <= 0) return res.status(404).json({
            message: "Usuario no encontrado"
        })  
        
        const [rows] = await conmysql.query('SELECT * FROM Usuarios WHERE usr_id = ?', [id])
        res.json(rows[0])
    } catch(error) {
        return res.status(500).json({message: 'Error al actualizar usuario'})
    }
}

export const deleteUsuario = async (req, res) => {
    try {
        const [rows] = await conmysql.query('DELETE FROM Usuarios WHERE usr_id = ?', [req.params.id])
        if (rows.affectedRows <= 0) return res.status(404).json({
            id: 0,
            message: 'No se pudo eliminar el usuario'
        })
        res.sendStatus(204)
    } catch (error) {
        return res.status(500).json({
            message: "Error de lado del servidor"
        })
    }
}