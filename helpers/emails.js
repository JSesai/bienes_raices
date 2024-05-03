import nodemailer from "nodemailer"

const emailRegistro = async (datos) => {
    console.log(datos)
    //extraemos los datos que llegan por parametro
    const { nombre, email, token } = datos
    //configuraciion para la conexion smtp de mailtrap
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })
    
    //enviar email transport se autentica en mailtrap accede a los servicios de mailtrap
    await transport.sendMail({ //utilizamos el metodo sendMail de nodemailer
        from: "BienesRaices.com", //quien manda el correo
        to: email, //destinatario
        subject: 'Confirma tu cuenta en BienesRaices.com',
        text: 'Confirma tu cuenta en BienesRaices.com',
        html: `
        <p>Hola ${nombre}, comprueba tu cuenta en BienesRaices.com</p>
        <p>Tu cuenta ya esta lista, solo debes confirmarla en el siguiente enlace:
        <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirmar/${token}">Confirmar cuenta </a>
        </p> 
        <br>
        <p>Si tú no creaste esta cuenta, puedes ignorar el mensaje</p>
        `
    })
    // console.log(`<a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirmar/${token}">Confirmar cuenta </a>`);
}

const emailOlvidePassword = async (datos) => {
    console.log(datos)
    //extraemos los datos que llegan por parametro
    const { nombre, email, token } = datos
    //configuraciion para la conexion smtp de mailtrap
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })
    
    //enviar email transport se autentica en mailtrap accede a los servicios de mailtrap
    await transport.sendMail({ //utilizamos el metodo sendMail de nodemailer
        from: "BienesRaices.com", //quien manda el correo
        to: email, //destinatario
        subject: 'Restablece tu password en BienesRaices.com',
        text: 'Restablece tu password en BienesRaices.com',
        html: `
        <p>Hola ${nombre}, has solicitado reestablecer tu password en BienesRaices.com</p>
        <p>Sigue el siguiente enlace para generar un password nuevo:
        <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/olvide-password/${token}">Reestablecer password</a>
        </p> 
        <br>
        <p>Si tú no solicitaste el restablecimiento de tu password, puedes ignorar el mensaje</p>
        `
    })
    // console.log(`<a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirmar/${token}">Confirmar cuenta </a>`);
}

export {
    emailRegistro,
    emailOlvidePassword
}