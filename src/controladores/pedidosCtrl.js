import { conmysql } from "../db.js";


export const getPedidos = async (req, res) => {
  try {
    // 1️⃣ Obtener todos los pedidos con datos del cliente
    const [pedidos] = await conmysql.query(`
      SELECT 
        p.ped_id,
        p.cli_id,
        c.cli_nombre,
        p.usr_id,
        p.ped_fecha,
        p.ped_estado
      FROM pedidos p
      LEFT JOIN clientes c ON p.cli_id = c.cli_id
      ORDER BY p.ped_fecha DESC
    `);

    if (pedidos.length === 0) {
      return res.status(404).json({ message: "No hay pedidos registrados" });
    }

    // 2️⃣ Obtener todos los detalles de pedidos (con nombre del producto)
    const [detalles] = await conmysql.query(`
      SELECT 
        d.det_id,
        d.ped_id,
        d.prod_id,
        pr.prod_nombre,
        d.det_cantidad,
        d.det_precio,
        (d.det_cantidad * d.det_precio) AS det_total
      FROM pedidos_detalle d
      LEFT JOIN productos pr ON d.prod_id = pr.prod_id
    `);

    // 3️⃣ Asociar los detalles con cada pedido
    const pedidosConDetalles = pedidos.map(pedido => {
      const dets = detalles.filter(d => d.ped_id === pedido.ped_id);

      // Calcular total del pedido
      const totalPedido = dets.reduce((acc, d) => acc + d.det_total, 0);

      return {
        ...pedido,
        total_pedido: totalPedido,
        detalles: dets
      };
    });

    // 4️⃣ Responder con la lista completa
    res.json({
      cant: pedidosConDetalles.length,
      data: pedidosConDetalles
    });

  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};




export const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Obtener el pedido principal (con datos del cliente)
    const [pedidoResult] = await conmysql.query(`
      SELECT 
        p.ped_id,
        p.cli_id,
        c.cli_nombre,
        c.cli_telefono,
        c.cli_correo,
        c.cli_direccion,
        p.usr_id,
        p.ped_fecha,
        p.ped_estado
      FROM pedidos p
      LEFT JOIN clientes c ON p.cli_id = c.cli_id
      WHERE p.ped_id = ?
    `, [id]);

    if (pedidoResult.length === 0) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    const pedido = pedidoResult[0];

    // 2️⃣ Obtener los detalles del pedido
    const [detalles] = await conmysql.query(`
      SELECT 
        d.det_id,
        d.ped_id,
        d.prod_id,
        pr.prod_nombre,
        d.det_cantidad,
        d.det_precio,
        (d.det_cantidad * d.det_precio) AS det_total
      FROM pedidos_detalle d
      LEFT JOIN productos pr ON d.prod_id = pr.prod_id
      WHERE d.ped_id = ?
    `, [id]);

    // 3️⃣ Calcular total general del pedido
    const totalPedido = detalles.reduce((acc, d) => acc + d.det_total, 0);

    // 4️⃣ Armar la respuesta final
    res.json({
      ped_id: pedido.ped_id,
      ped_fecha: pedido.ped_fecha,
      ped_estado: pedido.ped_estado,
      cliente: {
        cli_id: pedido.cli_id,
        cli_nombre: pedido.cli_nombre,
        cli_telefono: pedido.cli_telefono,
        cli_correo: pedido.cli_correo,
        cli_direccion: pedido.cli_direccion
      },
      usuario: pedido.usr_id,
      total_pedido: totalPedido,
      detalles
    });

  } catch (error) {
    console.error("Error al obtener pedido por ID:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};





export const postPedido = async (req, res) => {
  const connection = await conmysql.getConnection(); // para usar transacción
  try {
    const { cli_id, usr_id, detalles } = req.body;

    if (!cli_id || !usr_id || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ message: "Faltan datos o el pedido no tiene detalles" });
    }

    // Iniciamos la transacción
    await connection.beginTransaction();

    // 1️⃣ Insertar el pedido
    const [pedidoResult] = await connection.query(
      "INSERT INTO pedidos (cli_id, ped_fecha, usr_id, ped_estado) VALUES (?, NOW(), ?, 0)",
      [cli_id, usr_id]
    );

    const ped_id = pedidoResult.insertId;

    // 2️⃣ Insertar los detalles del pedido
    for (const det of detalles) {
      const { prod_id, det_cantidad, det_precio } = det;

      await connection.query(
        "INSERT INTO pedidos_detalle (prod_id, ped_id, det_cantidad, det_precio) VALUES (?, ?, ?, ?)",
        [prod_id, ped_id, det_cantidad, det_precio]
      );
    }

    // 3️⃣ Confirmamos la transacción
    await connection.commit();

    res.json({
      ped_id,
      message: "Pedido registrado correctamente",
    });

  } catch (error) {
    // Si hay error, deshacemos los cambios
    if (connection) await connection.rollback();
    console.error("Error al registrar pedido:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  } finally {
    if (connection) connection.release(); // liberamos la conexión
  }
};

