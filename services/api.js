const axios = require('axios');

async function get(endpoint, data) {
    try {
        const response = await axios.get(
            process.env.API_URL + endpoint,
            {
                params: data,
                headers: {
                    'X-API-KEY': process.env.API_KEY
                }
            }
        );
        
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }

        console.error(error.message);

        return {
            status: 'error',
            message: 'Unable to connect to Laravel.'
        };
    }
}

async function post(endpoint, data) {
    try {
        const response = await axios.post(
            process.env.API_URL + endpoint,
            data,
            {
                headers: {
                    'X-API-KEY': process.env.API_KEY
                }
            }
        );

        return response.data;

    } catch (error) {

        if (error.response) {
            return error.response.data;
        }

        console.error(error.message);

        return {
            status: 'error',
            message: 'Unable to connect to Laravel.'
        };
    }
}

module.exports = {
    get,
    post
};