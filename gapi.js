// Good docs here:
//   https://developers.google.com/youtube/v3/docs/#resource-types
var util = require('./util');
require('./logging')();

function GAPI(config) {
  var api_key = config.google_api_key;
  var google = require('googleapis');
  var moment  = require('moment');
  var gapi = google.youtube('v3');
  var youtube = this;

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
    gapi.search.list(params, function(err, resp) {
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
      gapi.videos.list(params, function(err, resp) {
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
  this.playlist = function(id, callback, page_token) {
    console.log('youtube playlist');
    var params = {
      part: 'id,snippet',
      maxResults: 50,      // this is the maximum allowed
      playlistId: id,
      auth: api_key
    };

    if (page_token) { params.pageToken = page_token }

    // Returns an array of result items with this structure:
    //   https://developers.google.com/youtube/v3/docs/search/list#response
    gapi.playlistItems.list(params, function(err, resp) {
      if (err) {
        console.log(err)
      } else {
        var next_page_token = resp.nextPageToken;
        if (resp && resp.items && resp.items.length > 0) {
          var video_list = resp.items.map(function(item) {
            return { title: item.snippet.title,
              id: item.snippet.resourceId.videoId,
              position: item.snippet.position
            }
          });

          // Sort by 'position', in place
          video_list.sort(function(a, b) {
            if (a.position <= b.position) {
              return -1;
            } else {
              return 1;
            }
          });

          // If there's a next page, recursively call playlist() until there's
          // no next page. Each invocation calls the callback with a separate
          // chunk of items
          if (next_page_token) {
            console.log('calling with next page', next_page_token);
            youtube.playlist(id, callback, next_page_token);
            callback(video_list);
          }
        }
      }
    });
  };
}

module.exports = function(config) {
  return new GAPI(config);
}
