import jwt from "jsonwebtoken" //dependencia para firmar con jwt//  npm i jsonwebtoken
import crypto from "crypto"
const generarId = () => crypto.randomUUID()

//fn que genera un token a partir de un id 
const generarJWT = id => jwt.sign({ //sing crea el token lo que tiene dentro es lo que va a transformar en jwt
       id
    }, process.env.JWT_SECRET, { //llave  que sirve para poder firmar el jwt y esta almacenada en .env variable de entorno
       expiresIn: "1d" //tiempo de expiracion del token
    }) 




export { 
    generarId, 
    generarJWT 
}