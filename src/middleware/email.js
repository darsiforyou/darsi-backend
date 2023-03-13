const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const send_email = (email, inout) => {
  return new Promise((resolve, reject) => {
    sgMail
      .send({
        to: email, // Change to your recipient
        from: "darsiforyou@gmail.com", // Change to your verified sender
        // templateId: 'd-7e9e9f2863374a969506cccaa4e7806f',
        // dynamic_template_data: {
        //     code: code
        // },
        ...inout,
      })
      .then((res) => {
        resolve({ status: "success" });
      })
      .catch((error) => {
        reject(error);
        console.error(error);
      });
  });
};
module.exports = send_email;
