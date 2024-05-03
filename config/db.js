import { Sequelize } from "sequelize"; //orm (mapping relational object) es una manera de conectar con una bd, es una dependdecia que ayuda a manejar los registros como objetos y facilita hacer crud
import dotenv from 'dotenv'
dotenv.config({path: '.env'})
//instanciamos Sequelize y pasamos como argumentos nombre de la bd, usuario, password (como variables de entorno) y un objeto de configuracion
const db = new Sequelize(process.env.BD_NAME, process.env.BD_USER, process.env.BD_PASSWORD,{
    host: process.env.BD_HOST, //el host al que se conecta, esto cambia si se tiene en otro servidor la bd
    port: process.env.BD_PORT, // puerto de conexion el default es 3306
    dialect: 'mysql', //es la bd que esta soportando puede ser cualquiera de estos motores mysql, mariadb, sql server, postgres
    define: {
        timestamps: true //timestamps en true agrega 2 columnas extras que son cuando fue creada y cuando fue actualizada
    },
    pool:{ //pool permite administrar la configuracion para conexiones nuevas o existentes
        max: 5,  //numero de conexiones maximo que puede mantener por usuario
        min: 0, //numero minimo de conexiones 
        acquire: 30000, //acquire son en milisegundos y corresponde el tiempo que trata en hacer la conexion antes de marcar error
        idle: 10000 //idle corresponde al tiempo que le da para terminar la conexion si no hay interaccion
    },
    operatorAliases: false //corresponde a los aliases que ya no se usan porque esta obsoleto en sequelice
})

export default db; // exportamos la conexion 