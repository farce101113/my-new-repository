const express = require('express')
const { Client } = require('pg'); //Importar el cliente de postgreSQL
const app = express()
const port = 3000

//Conexion a la base de datos PostgreSQL
const client = new Client({
  user: 'postgres', // Usuario de la base de datos
  host: 'localhost', //Direccion de host, si estas usando Docker, podria ser el nombre del contenedor
  database: 'db_languages', //Nombre de la base de datos
  password: 'postgres', //Contraseña de la base de datos
  port: 5432, //Puerto por defecto
});

client.connect(); //Conectar el cliente de la base de datos

app.use(express.json()); //Middleware para analizar el cuerpo de las solicitudes JSON

//Obtener todos los lenguajes
app.get('/api/v1/languages', async (req, res) => {
  try{
    const result = await client.query('SELECT * From languages'); //Realiza una consulta SELECT
    res.send(result.rows); //Devuelve los lenguajes obtenidos de la base de datos
  } catch (error) {
    console.error('Error al obtener los lenguajes:', error);
    res.status(500).send({ error: 'Error al obtener los lenguajes' });
  }
  });


//Obtener un lenguaje por ID
app.get('/api/v1/languages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query('SELECT * FROM languages WHERE id = $1', [id]); //Usar parametros para evitar SQL Injection
    if (result.rows.length > 0) {
      res.send(result.rows[0]);
    } else {
      res.status(404).send({ error: 'Lenguaje no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener el lenguaje:', error);
    res.status(500).send({ error: 'Error al obtener el lenguaje' });
  }
});

// Crear un nuevo lenguaje
app.post('/api/v1/languages', async (req, res) => {
  const { name, year, last_version } = req.body
  

  //Validar que los datos necesarios estan presentes

  if(!name || !year || !last_version) {
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!year) missingFields.push('year');
    if (!last_version) missingFields.push('last_version');

    // Construir mensaje de error dinámico
    return res.status(400).send({
      error: `Faltan datos necesarios: ${missingFields.join(', ')}`
    });
  }

  try {
    const result = await client.query(
      'INSERT INTO Languages (name, year, last_version) VALUES ($1, $2, $3) RETURNING *',
      [name, year, last_version]
    ); //Inserta el nuevo lenguaje en la base de datos
    res.status(201).send(result.rows[0]); // Retorna el lenguaje insertado
  } catch (error) {
    console.error('Error al crear el lenguaje:', error);
    res.status(500).send({ error: 'Error al crear el lenguaje' });
  }
});

// Eliminar un lenguaje
app.delete('/api/v1/languages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query('DELETE FROM languages WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.status(200).send({ message: 'Lenguaje eliminado', language: result.rows[0] });
    } else {
      res.status(404).send({ error: 'Lenguaje no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar el lenguaje:', error);
    res.status(500).send({ error: 'Error al eliminar el lenguaje' });
  }
});

//Actualizar un lenguaje
app.put('/api/v1/languages/:id', async (req, res) => {
  const { id } = req.params;
  const { name, year, last_version } = req.body;

  try {
    const result = await client.query(
      'UPDATE Languages SET name = $1, year = $2, last_version = $3 WHERE id = $4 RETURNING *',
      [name, year, last_version, id]
    );

    if (result.rows.length > 0) {
      res.status(200).send({ message: 'Lenguaje actualizado', language: result.rows[0] });
    } else {
      res.status(404).send({ error: 'Lenguaje no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualicar el lenguaje:', error);
    res.status(500).send({ error: 'Error al actualizar el lenguaje' });
  }
});

//Configurar el servidor para que escuche en el puerto 3000
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});