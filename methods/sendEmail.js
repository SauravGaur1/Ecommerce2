const { callbackify } = require('util')

const mailjet = require('node-mailjet').apiConnect(
    "3fb2683466c90cf583f5c482d08bcdc2",
    "09b11c6189ed7f6d80e011c8145de19f"
)
  
module.exports = function(recipientMail,recipientName,otp,callback) {
      const request = mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: 'sgaur70155@gmail.com',
              Name: 'Saurav Gaur',
            },
            To: [
              {
                Email: recipientMail,
                Name: recipientName,
              },
            ],
            Subject: 'Thanks for registering at LOGO ',
            TextPart: 'Greetings from LOGO! please verify your account ,happy shopping!',
            HTMLPart:
              `<h3> Dear ${recipientName}, here is your OTP for Account verification ${otp} Dont share it with anyone!`,
          },
        ],
      })
      request
        .then(result => {
         
          callback(null,result.body);
        })
        .catch(err => {
          console.log(err.Messages);
          callback(err,null);
        })
}