var OnLoadCallback = function() {
  console.log('OnLoadCallback called');
  console.log(gapi.client);
  /*
gapi.client.request({
    'path': 'plus/v1/people',
      'params': {'query': name}
       }).then(function(resp) {
            processResponse(resp.result);
             });*/
}
