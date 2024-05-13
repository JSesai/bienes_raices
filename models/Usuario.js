import { DataTypes } from "sequelize"; //importamos dataTypes para definir los datos que va arecibir el modelo
import db from "../config/db.js" //importamos la conexion a la BD
import bcrypt from "bcrypt" //dependencia que sirve para encriptar y comparar datos hasheados (los datos hasheados por esta libreria no es pósible deshashearlos por lo que la unica forma que podemos cambiar el password es reescribiendolo)
//definimos el modelo, esto creara un registro en la tabla usuario si no existe la tabla la crea
const usuario = db.define('usuarios', {
    //definimos los campos poniendo que tipos de datos son
    nombre: {
        type: DataTypes.STRING, //definicion de tipo de dato string, se puede pasar la longitud DataTypes.STRING(15)
        allowNull: false, //indica que el campo no puede ir vacio

    },
    //campo apellido
    email: {
        type: DataTypes.STRING, //de tipo string
        allowNull: false //no se permite null por lo que es obligatorio
    },
    //campo password
    password:{
        type: DataTypes.STRING, //de tipo string
        allowNull: false //no permite nulos
    },
    //campo token
    token: DataTypes.STRING, //de tipo string como solo tiene un valor podemos usar la sintaxis de una linea oimitiendo el objeto
    
    //campo confirmacion, es de tipo boleano y como solo tiene un valor podemos usar la sintaxis de una linea oimitiendo el objeto
    confirmado: DataTypes.BOOLEAN

},{
    //en sequelice se pueden implementar hooks estos se ejecutan en determinado momento, al eliminar, actualizar o insertar un registro
    hooks: {
        //ussamos el hook para antes de crear hashear el password con la intencion de que no este en texto plano
        beforeCreate: async function(usuario) { //debe ser una funcion declarada y no de expresion y recibe usuario que es el registro que se esta generando que desde el controler es lo que manda el usaurio el req.body pero aqui ya se instancia de esta manera
            const salt = await bcrypt.genSalt(10) //generamos un salt de 10 rondas de hasheo entre mas grande es mas dificil desencriptar pero consume mas recurso del server por lo que 10 esta bien
            usuario.password = await bcrypt.hash(usuario.password, salt) //sobreescribimos el password con ese mismo valor pero hasheado y pasamos el salt como segundo argumento

        },
       

        
    }
})

//todos los objetos en js tienen un protoype de esta manera sequelice nos permite registrar metodos perzonalizados
//registramos metodo para comparar password
usuario.prototype.verificarPassword = function(password){ //tiene que ser function declaration porque con arrow function no se puede usar this
    //compara el password que recibe como parametro y lo compara con el password de la instancia de usuario
    return bcrypt.compareSync(password, this.password) //retorna true si son iguales o false si no lo son

}

export default usuario