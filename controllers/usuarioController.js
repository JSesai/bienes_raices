//!!archivo controlador para usuario, es quien interactua con el modelo y las vistas, un cloente solicita una vista el gestiona para poder devolver el html y se pinte del lado del cliente
import { check, validationResult } from "express-validator" //libreria para poder ralizar validaciones
import bcrypt from "bcrypt" //dependencia que sirve para encriptar y comparar datos hasheados (los datos hasheados por esta libreria no es pósible deshashearlos por lo que la unica forma que podemos cambiar el password es reescribiendolo)
import Usuario from "../models/Usuario.js" //importamos el modelo es el que interactua con la bd
import { generarId, generarJWT } from "../helpers/tokens.js"
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js"



//controlador que llama a la vista del formulario login y lo devuelve para renderizar 
const formularioLogin = (req, res) => {
    //render, indicamos la ruta del archivo que renderiza una plantilla (vista) ya no se especifica views porque fue definida al inicio cuandp se le indica que usaremos un motor de plantillas
    res.render('auth/login', {
        pagina: "Iniciar Sesión",
        csrfToken: req.csrfToken(), //token para que se pueda validar el csrfToken de lo contrario marcara error
        autenticado: true
    })
}

//fn que valida la autenticacion (email y password) del usuario 
const autenticarUser = async (req, res) => {
    // console.log('autenticando');
    const { email, password } = req.body //extraemos lo que llega en el body de la peticion 

    //validamos que los campos cumplan con lo que requerimos
    await check('email').isEmail().withMessage('El email no tiene un formato valido').run(req) //valida erl formato del email 
    await check('password').notEmpty().withMessage('El password es obligatorio').run(req)  //valida longitud de contraseña sea minimo de 6

    //esta funcion evalua el resultado de la validacion que acabamos de hacer en las lineas anteriores
    let validationDataForm = validationResult(req) //guarda messagge con lo que hemos determinado en caso de que no se cumpla la validacion
    // return res.json(validationDataForm.array())

    //validamos si resultado contiene algo (no esta vacio) es porque hay errores
    if (!validationDataForm.isEmpty()) {
        return res.render('auth/login', {
            pagina: "Error Inicio de Sesión",
            csrfToken: req.csrfToken(), 
            errores: validationDataForm.array(), //pasamos el erroor convertido en un array
            usuario: {
               email
            }
        })
    }

    //si llega a este punto ya paso la validacion por lo que ahora buscamos al usuario para poder comparar su password con la que tenemos en la BD

    //buscamos usuario por conincidencia de email
    const UserLoggin = await Usuario.findOne({where: {email}})

    //validamos si no existe el usuario
    if(!UserLoggin) {
        return res.render('auth/login', {
            pagina: 'Error Inicio de Sesión',
            errores: [{ msg: 'El usuario no existe' }], //pasamos el erroor en un array y dentro un objeto por la estructura que espera la vista
            csrfToken: req.csrfToken(),
            usuario: {
                email
            }
        })
    }
    //validamos si no esta confirmado el usuario
    if(!UserLoggin.confirmado) {
        return res.render('auth/login', {
            pagina: 'Confirma tu Cuenta',
            errores: [{ msg: 'Debes de confirmar tu cuenta desde tu email' }], //pasamos el erroor en un array y dentro un objeto por la estructura que espera la vista
            csrfToken: req.csrfToken(),
            usuario: {
                email
            }
        })
    }

    //en este punto el usuario existe(tenemos la instancia que es el usuario encontrado) y la cuenta esta confirmada, comparamos las contraseñas
    //validamos si no son iguales el password recibido con el almacenado en la BD que en este momento lo tenemos instanciado y podemos usar el metodo que hemos reqgistrado en el modelo
    if (!UserLoggin.verificarPassword(password)){
        return res.render('auth/login', {
            pagina: 'Error Inicio de Sesión',
            errores: [{ msg: 'El password es incorrecto' }], //pasamos el erroor en un array y dentro un objeto por la estructura que espera la vista
            csrfToken: req.csrfToken(),
            usuario: {
                email
            }
        })
    }

    //autenticar al usuario,ya paso todas las validaciones. lo hacemos con JWT y pasando el id de la instancia del usuario
    const token = generarJWT(UserLoggin.id)
    console.log(token);
    console.log('continua');
    //almacenar el token en cookie
    return res.cookie('_token', token, {
        httpOnly: true,
        // secure: true //segurodad para cifrado ssl
    }).redirect('/mis-propiedades')

    // return res.json({ msg: "hola" }) 
    

}

//controlador que llama  a la vista de formulario de registrar usuario 
const formularioRegistro = (req, res) => {
    console.log(req.csrfToken());
    // metodo render responde con un tempalte que se renderiza del lado del cliente
    res.render('auth/registro', { //indioca la ruta de donde tomara el template
        pagina: 'Crear Cuenta', //pasamos datos hacia la vista
        csrfToken: req.csrfToken() //token para que se pueda validar el csrfToken de lo contrario marcara error
    })
}

//controlador para registrar usuario, valida los datos que se envian desde el formulario (vista)
const registrar = async (req, res) => {
    //para leer body recuerda tener habilitada la lectura de datos con express.urlencoded({extend: true}) generalmente es en el index
    // console.log('registrando', req.body);
    //extraemos los datos para una sintaxis mas limpia
    // console.log(req.csrfToken());
    const { nombre, email, password } = req.body

    //validaciones de los campos recibidos recuerda que el dato que recibimos es lo que se describe en el input en su propiedad name (ojo ahi) con la libreria chech de express
    await check('nombre').notEmpty().withMessage('El nombre es obligatorio').run(req) //validamos el input nombre en su propiedad name que es nombre no sea vacio, personalizamos el mensaje que devolveremos, el metodo run ejecuta y le pasamos en donde va a buscar y es en request que es la peticion que nos manda el cliente
    await check('email').isEmail().withMessage('El email no tiene un formato valido').run(req) //valida erl formato del email 
    await check('password').isLength({ min: 2 }).withMessage('El password debe ser minimo de 6 caracteres').run(req)  //valida longitud de contraseña sea minimo de 6
    await check('repetir_password').equals(password).withMessage('Los password no son iguales').run(req)  //valida que repetior contraseña sea igual a contraseña

    //esta funcion evalua el resultado de la validacion que acabamos de hacer en las lineas anteriores
    let resultado = validationResult(req) //guarda messagge con lo que hemos determinado en caso de que no se cumpla la validacion
    //return res.json(resultado.array())



    //si no esta vacio es porque no se pasaron las validaciones correctamente
    if (!resultado.isEmpty()) {
        // todo:: se renderiza la misma pagina de registro y se le pasa una propiedad mas para mandar el error
        // metodo render responde con un tempalte que se renderiza del lado del cliente
        console.log('hay errores');
        return res.render('auth/registro', { //indioca la ruta de donde tomara el template
            pagina: 'Crear Cuenta', //pasamos datos hacia la vista
            errores: resultado.array(), //pasamos el erroor convertido en un array
            csrfToken: req.csrfToken(), //token para que se pueda validar el csrfToken de lo contrario marcara error
            //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
            usuario: {
                nombre,
                email
            }
        })
    }


    //buscar si el usuario ya existe
    const existeUsuario = await Usuario.findOne({ where: { email: email } }) //buscamos almenos uno con la sintaxis where y ponemos la columna donde debe de hacer mach, en este caso es email y ponemos el email que recibimos

    //Validamos si existe
    if (existeUsuario) {
        console.log('El usuario ya existe!!');
        return res.render('auth/registro', { //indioca la ruta de donde tomara el template que devolvera
            pagina: 'Crear Cuenta', //pasamos datos dinamicos para mostrar en la vista
            errores: [{ msg: 'El usuario ya existe' }], //creamos un arreglo al vuelo (es decir se genera en ese momento) con la misma estructura de los errores que manejamos con la inrtencion de reutilzar la logica de la vista 
            csrfToken: req.csrfToken(), //token para que se pueda validar el csrfToken de lo contrario marcara error
            //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
            usuario: {
                nombre,
                email
            }
        })
    }

    try {
        //creamos un registro con el metodo create y le pasamos la informacion que nos llega desde el formulario hacia el modelo
        const createUser = await Usuario.create({
            nombre,
            email,
            password,
            token: generarId()
        })
        //si el usuario se creo correctamente se envia correo y se renderiza un mensaje con informacion de cuenta creada correctamente
        if (createUser) {
            //fn para enviar email ocupamos la instancia del registro que se ha guardado en la BD
            emailRegistro({
                nombre: createUser.nombre,
                email: createUser.email,
                token: createUser.token
            })
            console.log('El usuario fue creado correctamente!!');
            return res.render('templates/mensaje', { //indioca la ruta de donde tomara el template que devolvera
                pagina: 'Cuenta creada correctamente', //pasamos datos dinamicos para mostrar en la vista
                //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
                mensaje: 'Hemos enviado un Email de confirmacion, confirma tu cuenta!!  '
            })
        }



    } catch (error) {
        console.log(error);
    }



}

//controlador para confirmar cuenta
const confirmar = async (req, res) => {
    // destructuramos para extraer el token
    const { token } = req.params
    console.log(token);
    //validar si el token es valido 
    const userToken = await Usuario.findOne({ where: { token } }) //buscamos el token en la BD
    if (!userToken) {//si no existe 
        //mandamos un mensaje de error
        console.log('El token no fue encontrado en la BD !!');
        return res.render('auth/confirmar-cuenta', { //indioca la ruta de donde tomara el template que devolvera
            pagina: 'Error al confirmar tu cuenta', //pasamos datos dinamicos para mostrar en la vista
            //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
            mensaje: 'Hubo un error al confirmar tu cuenta 😭 , intentalo de nuevo ',
            error: true
        })
    }

    //confirmar la cuenta recordemos que el ORM (mapping relational model) nos permite tratar los registros de nuestra BD relacional como objetos
    console.log(userToken);
    userToken.token = null //dejamos la propiedad token vacio ya que solo es de un uso para evitar que se vuelva a reutilizar
    userToken.confirmado = true //ponemos la propiedad confirmado en true

    //ahora tenemos los datos modificados pero estan solo en memoria por lo que debemos de guardarlos en la bd
    await userToken.save() //usamos la instancia que tenemos en memoria y con el metodo save lo guardamos

    //retornamos la vista de confirmar cuenta pero ahora No la manejamos como error
    return res.render('auth/confirmar-cuenta', { //indioca la ruta de donde tomara el template que devolvera
        pagina: 'Cuenta confirmada', //pasamos datos dinamicos para mostrar en la vista
        //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
        mensaje: 'Tu Cuenta se ha confirmado correctamente 🥳'
    })

}

//controlador para recuperar cuenta 
const formularioOlvidePassword = (req, res) => {
    // metodo render responde con un tempalte que se renderiza del lado del cliente
    res.render('auth/olvide-password', { //indioca la ruta de donde tomara el template
        pagina: 'Recupera tu Cuenta', //pasamos datos hacia la vista
        csrfToken: req.csrfToken() //token para que se pueda validar el csrfToken de lo contrario marcara error
    })
}

//fn para controlar el envio de token por email
const resetPassword = async (req, res) => {
    const { email } = req.body

    await check('email').isEmail().withMessage('El email no tiene un formato valido').run(req) //valida erl formato del email 

    //esta funcion evalua el resultado de la validacion que acabamos de hacer en las lineas anteriores
    let resultado = validationResult(req) //guarda messagge con lo que hemos determinado en caso de que no se cumpla la validacion

    //si no esta vacio es porque no se pasaron las validaciones correctamente
    if (!resultado.isEmpty()) {
        // todo:: se renderiza la misma pagina de registro y se le pasa una propiedad mas para mandar el error
        // metodo render responde con un tempalte que se renderiza del lado del cliente
        console.log('El email no tiene un formato valido');
        return res.render('auth/olvide-password', { //indioca la ruta de donde tomara el template
            pagina: 'Recupera tu Cuenta', //pasamos datos hacia la vista
            errores: resultado.array(), //pasamos el erroor convertido en un array
            csrfToken: req.csrfToken(), //token para que se pueda validar el csrfToken de lo contrario marcara error
            //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
            usuario: {
                email
            }
        })
    }

    //buscar si el usuario existe
    const user = await Usuario.findOne({ where: { email } }) //buscamos almenos uno con la sintaxis where y ponemos la columna donde debe de hacer mach, en este caso es email y ponemos el email que recibimos

    //si no existe el usuario
    if (!user) {
        console.log('El email no existe!!');
        return res.render('auth/olvide-password', { //indioca la ruta de donde tomara el template
            pagina: 'Recupera tu Cuenta', //pasamos datos hacia la vista
            errores: [{ msg: 'El email no pertenece a ningun usuario' }], //creamos un mensaje en array porque asi lo lee la vista
            csrfToken: req.csrfToken(), //token para que se pueda validar el csrfToken de lo contrario marcara error
            //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
            usuario: {
                email
            }
        })

    }

    try {

        console.log('El email si existe!!');
        user.token = generarId() //asignamos un nuevo id que es el token
        user.confirmado = false //ponermos la propiedad confirmado a false
        //guardamos el registro
        const userUpdate = await user.save()

        //si el usuario se creo correctamente se envia correo y se renderiza un mensaje con informacion de cuenta creada correctamente
        if (userUpdate) {
            //fn para enviar email ocupamos la instancia del registro que se ha guardado en la BD
            emailOlvidePassword({
                nombre: userUpdate.nombre,
                email: userUpdate.email,
                token: userUpdate.token
            })
            console.log('El token del usuario se actualizo correctamente!!');
            return res.render('templates/mensaje', { //indioca la ruta de donde tomara el template que devolvera
                pagina: 'Reestablece tu password', //pasamos datos dinamicos para mostrar en la vista
                //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
                mensaje: 'Hemos enviado un Email para que puedas reestablecer tu password'
            })
        }



    } catch (error) {
        console.log(error);
    }
}

//fn para validar el restablecimiento de password, valida el token del usuario
const comprobarToken = async (req, res) => {
    const { token } =  req.params //destructurar la propiedad token que viene viajando en la url por eso es params
    console.log(token);
    //validar si el token existe 
    try {
        //buscamos el token para recuperar la instancia del usuario
        const usuario = await Usuario.findOne({where : {token}})
        if(!usuario){
            //mandamos un mensaje de error
            console.log('El token no fue encontrado en la BD !!');
            return res.render('auth/confirmar-cuenta', { //indioca la ruta de donde tomara el template que devolvera
                pagina: 'Error al restablecer password', //pasamos datos dinamicos para mostrar en la vista
                //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
                mensaje: 'Hubo un error al restablecer el password de tu cuenta 😭 , intentalo de nuevo ',
                error: true
            })
        }

        //validacion de token; recordemos que el ORM (mapping relational model) nos permite tratar los registros de nuestra BD relacional como objetos
        console.log(usuario);
      
        //ahora tenemos los datos modificados pero estan solo en memoria por lo que debemos de guardarlos en la bd
        await usuario.save() //usamos la instancia que tenemos en memoria y con el metodo save lo guardamos

        //como ya se valido retornamos la vista para que pueda ingresar su password nueva
        return res.render('auth/nuevo-password', { //indioca la ruta de donde tomara el template que devolvera
            pagina: 'Reestablecer Password', //pasamos datos dinamicos para mostrar en la vista
            //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
            csrfToken: req.csrfToken(), //token para que se pueda validar el csrfToken de lo contrario marcara error

        })
    } catch (error) {
        console.log(error);
    }

}

//fn que trae la vista para que se ingrese la nueva password
const nuevoPassword = async (req, res) => {
    const { token } = req.params //destructurar la propiedad token que viene viajando en la url por eso es params
    const { password } = req.body //destructurar la propiedad password que viene viajando en el body del POST
    console.log(token);
    
    //validar si el token existe 
    try {
        //buscamos el token para recuperar la instancia del usuario
        const usuario = await Usuario.findOne({ where: { token } })
        if (!usuario) {
            //mandamos un mensaje de error
            console.log('El token no fue encontrado en la BD !!');
            return res.render('auth/nuevo-password', { //indioca la ruta de donde tomara el template que devolvera
                pagina: 'Error al restablecer password', //pasamos datos dinamicos para mostrar en la vista
                csrfToken: req.csrfToken(), //token para que se pueda validar el csrfToken de lo contrario marcara error
                //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
                mensaje: 'Hubo un error al restablecer el password de tu cuenta 😭 , intentalo de nuevo ',
                error: true
            })
        }

        //validar el nuevo pasword
        await check('password').isLength({ min: 6 }).withMessage('El password debe ser minimo de 6 caracteres').run(req)  //valida longitud de contraseña sea minimo de 6

        //esta funcion evalua el resultado de la validacion que acabamos de hacer en las lineas anteriores
        let resultado = validationResult(req) //guarda messagge con lo que hemos determinado en caso de que no se cumpla la validacion

        if(!resultado.isEmpty()){
            //mandamos un mensaje de error
            console.log('el password no cumple la longitud !!');
            return res.render('auth/nuevo-password', { //indioca la ruta de donde tomara el template que devolvera
                pagina: 'Error al restablecer password', //pasamos datos dinamicos para mostrar en la vista
                csrfToken: req.csrfToken(), //token para que se pueda validar el csrfToken de lo contrario marcara error
                //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
                errores: resultado.array(), //pasamos el erroor convertido en un array
                
            })

        }

        //validacion de token; recordemos que el ORM (mapping relational model) nos permite tratar los registros de nuestra BD relacional como objetos
        // console.log(usuario);
        usuario.token = null //dejamos la propiedad token vacio ya que solo es de un uso para evitar que se vuelva a reutilizar
        usuario.confirmado = true //ponemos la propiedad confirmado en true
        const salt = await bcrypt.genSalt(10) //generamos un salt de 10 rondas de hasheo entre mas grande es mas dificil desencriptar pero consume mas recurso del server por lo que 10 esta bien
        usuario.password = await bcrypt.hash(password, salt) //sobreescribimos el password con ese mismo valor pero hasheado y pasamos el salt como segundo argumento

        //ahora tenemos los datos modificados pero estan solo en memoria por lo que debemos de guardarlos en la bd
        await usuario.save() //usamos la instancia que tenemos en memoria y con el metodo save lo guardamos

        //como ya se valido retornamos la vista con el mensaje de que se ha realizado con exito el cambio de password
        res.render('auth/confirmar-cuenta', { //indioca la ruta de donde tomara el template que devolvera
            pagina: 'Password actualizado correctamente', //pasamos datos dinamicos para mostrar en la vista
            //devolvemos usuario esto sirve para que en la vista llenemos los campos que el usuario ha llenado y no tenga que poner los datos cada que envie el formulario y se encuentre algun error, recordemos que por seguridad nunca devuelvas las contraseñas
            mensaje: 'Ahora puedes iniciar sesión con tu nuevo password'
        })

    } catch (error) {
        console.log(error);
    }
}

export {
    formularioLogin,
    autenticarUser,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}