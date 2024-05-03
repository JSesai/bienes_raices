// const express = require('express') //exportacion COMMON JS
import express from 'express' //importacion con Module
import csrf from 'csurf' //dependencia para express que nos ayuda a evitar los ataques  de falsificación de petición en sitios cruzados (CSRF)
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js' //importamos la ruta de usuarios routes
import db from './config/db.js' //importamos el archivo que contiene la conexion  a la BD
import dotenv from 'dotenv'

dotenv.config({path: 'env'})

//crear la app
const app = express() //llamar express 

//habilitar lectura de datos de formulario, antes se usaba una libreria para poder leer los datos ahora express lo hace de manera nativa
app.use( express.urlencoded({extended:true}) )

//habilitamos cookie parser
app.use(cookieParser())

//habilitamos CSRF
app.use(csrf({cookie: true})) // la usamos con cookie porque tambien puede ser por sesion 

//trata de hacer la conexion a la BD
try {
    await db.authenticate() //metodo de autenticacion a la BD
    db.sync() //este metodo sirve para crear la tabla en caso de que no exista, es util cuando se crean los primeros registros porque nos evita crear las tablas de manera manual, si no lo ponemos y tratamos de crear un registro cuando la tabla no existe nos tirara un error
    console.log('conexion correcta a la base de datos');

    
} catch (error) {
    console.log(error);
}
//Cuando se hace el deploy se asignara una variable de entorno en el server y Sera la que tomara en process.env.PORT en caso de que no exista se asigna el 3000 es decir cuando estamos desarrollando tomara el 3000 pero una vez deployado tomara la que le asigne el server 
const port = process.env.PORT || 3000 // definir un numero de puerto

//un servidor siempre debe de estar a la escucha por lo que levantamos el sevicio con listen 
app.listen(port, ()=> {
    console.log(`servidor corriendo desde el puerto ${port}`)
})

//usamos un motor de plantilla (pug) para presentar el contenido html, es decir que el servidor sera el encargado de generar el htm y enviarlo cuando se solicite cierta ruta
app.set('view engine', 'pug') //indicamos que engine template vamos a usar porque soporta varias en este caso es pug
app.set('views', './views') //indicamos la ruta en la que se encontraran nuestras vistas 

//carpeta publica  -- indica donde express encuentra los archivos estaticos como imagenes y estilos que no cambian
app.use(express.static('public'))

//definimos los end points
//routing para usuario (endpoints)
app.use('/auth', usuarioRoutes) //use nos permite poder tener rutas que inicien con slash / y en seguida busca las url que coincidan con lo que hay en el archivo, si se usara get no podria obtener las rutas ya que get busca coincidencia exacta, es como decirle buscame lo que hay en el slash y seguido lo que indique el archivo 
