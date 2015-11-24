module.exports = {
    title: 'thejub.pub',
    mongodb_endpoint: 'mongodb://localhost',
    mongodb_db: 'jub-dj-dev',
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
    private_route: '/test_private_route', // I'm not telling
    moved_message: "This is a message telling users how to find out what the private route is."
};
