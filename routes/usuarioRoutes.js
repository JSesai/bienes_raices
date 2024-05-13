//Archivo que maneja las rutas de usuario
import express from 'express' //importamos express
import { formularioLogin, autenticarUser, formularioRegistro, formularioOlvidePassword, registrar, confirmar, resetPassword, comprobarToken, nuevoPassword } from '../controllers/usuarioController.js'


const router = express.Router() // usamos el metodo router
//definimos el routing es decir las rutas (endpoints) que son vervos http que esta separado poer tema de escalabilidad
router.get('/login', formularioLogin) //end point de login y lo controla el controlador formularioLogin y solo renderiza la vista del formulario
router.post('/login', autenticarUser) //end point de login y lo controla el controlador autenticarUser y valida los datos (email y pasword) que envia el usuario desde la vista del formulario

//end point de registro 
router.get('/registro', formularioRegistro)  //lo controla el controlador formularioRegistro login
router.post('/registro', registrar)  //lo controla el controlador formularioRegistro login

//endpoint para confirmar cuenta
router.get('/confirmar/:token', confirmar) //este endpoint tiene una ruta dinamica por lo que lo que se ponga despues de los 2 puntos se toma como una variable y su valor es lo que viene en la url en este caso http://localhost:3000/auth/confirmar/d4t0variable de manera que en el controler se puede extraer su valor quedando de esta manera {token : d4t0variable }

//end point de olvide password 
router.get('/olvide-password', formularioOlvidePassword)  //lo controla el controlador formularioOlvidePassword login
router.post('/olvide-password', resetPassword) //endpoint para resetear el password, recordemos que no es posible revertir el hasheo del password por lo que cuando nos manda el email desde el formulario de la vista de olvide-password a ese email mandamos un token para que el usuario cuando abra desde su email el enlace le permita generar un nuevo password que es el que estaremos sustituyendo

//endpoint para validar token cuando presiona el enlace del email llega a esta ruta porque ya trae el token
router.get('/olvide-password/:token', comprobarToken) //esta solicitud de tipo get valida el token
router.post('/olvide-password/:token', nuevoPassword) //esta solicitud de tipo post valida el token

export default router