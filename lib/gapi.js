// Good docs here:
//   https://developers.google.com/youtube/v3/docs/#resource-types
require('./logging')();

function GAPI(config) {
  var api_key = config.google_api_server_key;
  var cx_id = config.google_api_cx_id;
  var google = require('googleapis');
  var moment  = require('moment');
  var youtube = google.youtube('v3');
  var cse = google.customsearch('v1');
  var urlsh = google.urlshortener('v1');
  var gapi = this;

  // Perform an image search
  this.image_search = function(query, callback) {
    console.log('fetching image results for', query);
    var params = {
      q: query,
      cx: cx_id,
      searchType: 'image',
      key: api_key,
      safe: 'off'
    };

    // Returns an array of result items with this structure:
    //   https://developers.google.com/custom-search/json-api/v1/reference/cse/list#response
    cse.cse.list(params, function(err, resp) {
      if (err) console.error(err);
      if (resp && resp.items) {
        callback(resp.items);
      }
    });
  }

  this.one_image_link = function(query, callback) {
    gapi.image_search(query, function(items) {
      callback(items[0].link);
    });
  }

  // Takes in a URL (string), calls CB with a short URL (string)
  this.shorten_url = function(long_url, callback) {
    var params = {
      resource: { longUrl: long_url },
      key: api_key
    }

    urlsh.url.insert(params, function(err, resp) {
      if (err) console.error(err);
      if (resp && resp.id) {
        callback(resp.id);
      }
    });
  }

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
      if (err) console.error('youtube search error', err);
      if (resp && resp.items) {
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
        if (resp && resp.items && resp.items.length > 0) {
          var duration = resp.items[0].contentDetails.duration;
          obj.duration = moment.duration(duration).asMilliseconds();
          obj.title = resp.items[0].snippet.title;
        }
        callback(obj);
      });
    }
  }

  // Pass in a playlist ID, get back a list of video objects
  this.playlist = function(id, callback, page_token, list_prefix) {
    var params = {
      part: 'id,snippet',
      maxResults: 50,      // this is the maximum allowed
      playlistId: id,
      auth: api_key
    };

    list_prefix = list_prefix || [];
    if (page_token) { params.pageToken = page_token }

    // Returns an array of result items with this structure:
    //   https://developers.google.com/youtube/v3/docs/search/list#response
    youtube.playlistItems.list(params, function(err, resp) {
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

          // If there's a next page, recursively call playlist() until there's
          // no next page. Each invocation calls the callback with a separate
          // chunk of items
          if (next_page_token) {
            console.log('fetching next page of playlist', next_page_token);
            youtube.playlist(id, callback, next_page_token,
                             list_prefix.concat(video_list));
          } else {
            callback(list_prefix.concat(video_list));
          }
        }
      }
    });
  };
}

module.exports = function(config) {
  return new GAPI(config);
}
