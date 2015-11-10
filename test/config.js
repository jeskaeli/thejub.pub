module.exports = {
    title: 'thejub.pub',
    mongodb_endpoint: 'mongodb://localhost',
    mongodb_db: 'jub-dj',
    google_api_server_key: 'GOOGLE-SERVER-KEY-HERE', // get your own key
    google_api_browser_key: 'GOOGLE-BROWSER-KEY-HERE', // get your own key
    auth: {
        token_len: '20'
    },
    latest_updates: {
        date: '2015-11-6',
        list: [
            'A cool update',
            'A lame update'
        ]
    },
    private_route: '/foooooooooo', // I'm not telling
    moved_message: "Ask aromatt for the new URL! If you're having trouble reaching the site, replace 'thejub.pub' with 'jubpub.servebeer.com'."
};