const path = require('path');

// generate dynamic link for static resources
const genLink = (protocol, filename) => {
    return `${protocol}://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${process.env.UPLOAD_PATH}/${filename}`;
};

module.exports = {
    genLink
};