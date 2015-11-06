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
  if (obj.duration && obj.title) {
    callback(obj)
  } else {

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
    }, function(reason) {
      callback({});
    });
  }
}

// Returns an array of result items with this structure:
//   https://developers.google.com/youtube/v3/docs/search/list#response
var youtube_playlist = function(id, callback, page_token, list_prefix) {
  var params = {
    part: 'id,snippet',
    maxResults: 50,      // this is the maximum allowed
    playlistId: id,
    auth: gapi_key
  };

  list_prefix = list_prefix || [];
  if (page_token) { params.pageToken = page_token }

  gapi.client.youtube.playlistItems.list(params).then(function(resp) {
    var next_page_token = resp.result.nextPageToken;
    if (resp.result && resp.result.items && resp.result.items.length > 0) {
      var video_list = resp.result.items.map(function(item) {
        return {
          title: item.snippet.title,
          id: item.snippet.resourceId.videoId,
          position: item.snippet.position
        }
      });

      // If there's a next page, recursively call playlist() until there's
      // no next page. Then finally call the callback
      if (next_page_token) {
        console.log('fetching next page of playlist', next_page_token);
        youtube_playlist(id, callback, next_page_token,
          list_prefix.concat(video_list));
      } else {
        callback(list_prefix.concat(video_list));
      }
    }
  }, function(reason) {
    callback([]);
  });
}
