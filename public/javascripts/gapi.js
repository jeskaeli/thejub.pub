var gapi_key = 'AIzaSyAC05PGbv_Ze4jhKRUAq4QVHc_of-CCMCc';
var gapi_ready = false;

var OnGAPILoad = function() {
  gapi.client.setApiKey(gapi_key);
  gapi_ready = true;
}

var youtube_video_search = function(query, callback) {
  gapi.client.request({
    'path': 'youtube/v3/search',
    'params': {
      part: 'snippet',
      maxResults: 50,
      order: 'viewCount',
      q: query,
      type: 'video',
      auth: gapi_key
    }
  }).then(function(resp) {
    callback(resp.result.items);
  });
}

// Adds title and duration to video object, and calls callback with it
var youtube_video_specs = function(obj, callback) {
  console.log('fetching video specs for', obj);
  if (obj.duration && obj.title) {
    callback(obj)
  } else {
    var params = {
    };

    // Returns an array of result items with this structure:
    //   https://developers.google.com/youtube/v3/docs/search/list#response
    gapi.client.request({
      'path': 'youtube/v3/videos',
      'params': {
        part: 'snippet,contentDetails',
        id: [obj.id],
        auth: gapi_key
      }
    }).then(function(resp) {
      if (resp.result && resp.result.items && resp.result.items.length > 0) {
        var duration = resp.result.items[0].contentDetails.duration;
        obj.duration = moment.duration(duration).asMilliseconds();
        obj.title = resp.result.items[0].snippet.title;
      }
      callback(obj);
    });
  }
}
