// Good docs here:
//   https://developers.google.com/youtube/v3/docs/#resource-types
var util = require('./util');

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
      if (resp && resp.items) {
        console.log('returning results');
        callback(resp.items);
      }
    });
  };

  // Adds title and duration to video object, and calls callback with it
  this.video_specs = function(obj, callback) {
    if (obj.duration && obj.title) {
      callback(obj)
    } else {
       var params = {
        part: 'snippet,contentDetails',
        id: [obj.id],
        auth: api_key
      };

      // Returns an array of result items with this structure:
      //   https://developers.google.com/youtube/v3/docs/search/list#response
      youtube.videos.list(params, function(err, resp) {
        if (resp && resp['items'].length > 0) {
          var duration = resp.items[0].contentDetails.duration;
          obj.duration = moment.duration(duration).asMilliseconds();
          obj.title = resp.items[0].snippet.title;
        }
        callback(obj);
      });
    }
  }

  // Pass in a playlist ID, get back a list of video objects
  this.playlist = function(id, callback) {
    console.log('youtube playlist');
    var params = {
      part: 'id,snippet',
      playlistId: id,
      auth: api_key
    };

    // Returns an array of result items with this structure:
    //   https://developers.google.com/youtube/v3/docs/search/list#response
    youtube.playlistItems.list(params, function(err, resp) {
      if (err) { console.log(err) };
      if (resp && resp.items && resp.items.length > 0) {
        var video_list = resp.items.map(function(item) {
          return {
            title: item.snippet.title,
            id: item.snippet.resourceId.videoId
          }
        });
        callback(video_list);
      }
    });
  }
}

module.exports = function(config) {
  return new Youtube(config);
}
