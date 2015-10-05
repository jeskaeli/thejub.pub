// Good docs here:
//   https://developers.google.com/youtube/v3/docs/#resource-types


function Youtube(config) {
  var api_key = config.google_api_key;
  var google = require('googleapis');
  var moment  = require('moment');
  var youtube = google.youtube('v3');

  this.video_search = function(query, callback) {
    var params = {
      part: 'snippet',
      maxResults: 50,
      order: 'viewCount',
      q: query,
      type: 'video',
      auth: api_key
    };

    // Returns an array of result items with this structure:
    //   https://developers.google.com/youtube/v3/docs/search/list#response
    youtube.search.list(params, function(err, resp) {
      if (err) {
        console.log('youtube search error', err);
      }
      if (resp && resp['items']) {
        console.log('returning results');
        callback(resp['items']);
      }
    });
  };

  // Pass in a video ID, get back the title or null
  this.video_title = function(id, callback) {
    var params = {
      part: 'snippet',
      id: [id],
      auth: api_key
    };

    // Returns an array of result items with this structure:
    //   https://developers.google.com/youtube/v3/docs/search/list#response
    youtube.videos.list(params, function(err, resp) {
      var title = null;
      if (resp && resp['items'].length > 0) {
        title = resp['items'][0]['snippet']['title'];
      }
      callback(title);
    });
  }

  // Pass in a video ID, get back the length in seconds or null
  // TODO could save time by getting both title and duration in one request
  this.video_duration = function(id, callback) {
    var params = {
      part: 'contentDetails',
      id: [id],
      auth: api_key
    };

    // Returns an array of result items with this structure:
    //   https://developers.google.com/youtube/v3/docs/search/list#response
    youtube.videos.list(params, function(err, resp) {
      var duration = null;
      if (resp && resp['items'].length > 0) {
        duration = resp['items'][0]['contentDetails']['duration'];
        duration = moment.duration(duration).asMilliseconds();
      }
      callback(duration);
    });
  }

}

module.exports = function(config) {
  return new Youtube(config);
}
