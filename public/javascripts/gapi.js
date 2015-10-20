var gapi_ready = false;

var OnGAPILoad = function() {
  socket.emit('gapi key', function(key) {
    console.log('setting key', key);
    gapi_key = key;
    gapi.client.setApiKey(key);
    gapi.client.load('youtube', 'v3').then(function() {
      gapi_ready = true;
    });
  });
}

var youtube_video_search = function(query, callback) {
  gapi.client.youtube.search.list({
      part: 'snippet',
      maxResults: 50,
      order: 'viewCount',
      q: query,
      type: 'video'
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
    gapi.client.youtube.videos.list({
      part: 'snippet,contentDetails',
      id: [obj.id]
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
