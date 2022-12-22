const sendgrid = require ('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = ({ to, from, templateId, dynamicTemplateData }) => {
    const msg = { to, from, templateId, dynamicTemplateData };
    return sendgrid.sendMultiple(msg);
};

exports.sendEmail = sendEmail;