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

async function twitchGet(endpoint, data) {
    try {
        const response = await axios.get(
            process.env.TWITCH_API_URL + endpoint,
            {
                params: data,
                headers: {
                    'Authorization': 'Bearer '+process.env.BROADCASTER_ACCESS_TOKEN,
                    'Client-Id': process.env.BROADCASTER_CLIENT_ID,
                    'Content-Type': "application/json",
                }
            }
        );

        return response.data;

    } catch (error) {

        if (error.response) {
            return error.response.data;
        }

        console.error("ERROR: ", error.message);

        return {
            status: 'error',
            message: 'Unable to connect to Laravel.'
        };
    }
}

async function twitchPost(endpoint, data) {
    try {
        const response = await axios.post(
            process.env.TWITCH_API_URL + endpoint,
            data,
            {
                headers: {
                    'Authorization': 'Bearer '+process.env.BROADCASTER_ACCESS_TOKEN,
                    'Client-Id': process.env.BROADCASTER_CLIENT_ID,
                    'Content-Type': "application/json",
                }
            }
        );

        return response.data;

    } catch (error) {

        if (error.response) {
            return error.response.data;
        }

        console.error("ERROR: ", error.message);

        return {
            status: 'error',
            message: 'Unable to connect to Laravel.'
        };
    }
}

async function twitchOauth() {
    try {
        const response = await axios.get(
            'https://id.twitch.tv/oauth2/validate',
            {
                headers: {
                    'Authorization': 'OAuth '+process.env.BROADCASTER_ACCESS_TOKEN
                }
            }
        );

        return response.data;

    } catch (error) {

        if (error.response) {
            return error.response.data;
        }

        console.error("ERROR: ", error.message);

        return {
            status: 'error',
            message: 'Unable to connect to Laravel.'
        };
    }
}

async function twitchPatch(endpoint, data) {
    try {
        const response = await axios.patch(
            process.env.TWITCH_API_URL + endpoint,
            data,
            {
                headers: {
                    'Authorization': 'Bearer ' + process.env.BROADCASTER_ACCESS_TOKEN,
                    'Client-Id': process.env.BROADCASTER_CLIENT_ID,
                    'Content-Type': 'application/json',
                }
            }
        );

        return response.data;

    } catch (error) {

        if (error.response) {
            return error.response.data;
        }

        console.error("ERROR:", error.message);

        return {
            status: 'error',
            message: 'Unable to connect to Twitch.'
        };
    }
}

async function twitchDelete(endpoint, data) {
    try {
        const response = await axios.delete(
            process.env.TWITCH_API_URL + endpoint,
            {
                params: data,
                headers: {
                    'Authorization': 'Bearer ' + process.env.BROADCASTER_ACCESS_TOKEN,
                    'Client-Id': process.env.BROADCASTER_CLIENT_ID,
                    'Content-Type': 'application/json',
                }
            }
        );

        return response.data;

    } catch (error) {

        if (error.response) {
            return error.response.data;
        }

        console.error("ERROR:", error.message);

        return {
            status: 'error',
            message: 'Unable to connect to Twitch.'
        };
    }
}

async function put(endpoint, data) {
    try {
        const response = await axios.put(
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
    post,
    put,
    twitchGet,
    twitchPost,
    twitchOauth,
    twitchPatch,
    twitchDelete
};