// Failsafe:
// https://stackoverflow.com/questions/29881957/websocket-connection-timeout

/**
 * inits a websocket by a given url, returned promise resolves with initialized websocket, rejects after failure/timeout.
 *
 * @param url the websocket url to init
 * @param existingWebsocket if passed and this passed websocket is already open, this existingWebsocket is resolved, no additional websocket is opened
 * @param timeoutMs the timeout in milliseconds for opening the websocket
 * @param numberOfRetries the number of times initializing the socket should be retried, if not specified or 0, no retries are made
 *        and a failure/timeout causes rejection of the returned promise
 * @return {Promise}
 */
function initWebsocket(url, existingWebsocket, timeoutMs, numberOfRetries) {
  timeoutMs = timeoutMs ? timeoutMs : 1500;
  numberOfRetries = numberOfRetries ? numberOfRetries : 0;
  var hasReturned = false;
  var promise = new Promise((resolve, reject) => {
      setTimeout(function () {
          if(!hasReturned) {
              console.info('opening websocket timed out: ' + url);
              rejectInternal();
          }
      }, timeoutMs);
      if (!existingWebsocket || existingWebsocket.readyState != existingWebsocket.OPEN) {
          if (existingWebsocket) {
              existingWebsocket.close();
          }
          var websocket = new WebSocket(url);
          websocket.onopen = function () {
              if(hasReturned) {
                  websocket.close();
              } else {
                  console.info('websocket to opened! url: ' + url);
                  resolve(websocket);
              }
          };
          websocket.onclose = function () {
              console.info('websocket closed! url: ' + url);
              rejectInternal();
          };
          websocket.onerror = function () {
              console.info('websocket error! url: ' + url);
              rejectInternal();
          };
      } else {
          resolve(existingWebsocket);
      }

      function rejectInternal() {
          if(numberOfRetries <= 0) {
              reject();
          } else if(!hasReturned) {
              hasReturned = true;
              console.info('retrying connection to websocket! url: ' + url + ', remaining retries: ' + (numberOfRetries-1));
              initWebsocket(url, null, timeoutMs, numberOfRetries-1).then(resolve, reject);
          }
      }
  });
  promise.then(function () {hasReturned = true;}, function () {hasReturned = true;});
  return promise;
};

/*
initWebsocket('ws:\\localhost:8090', null, 5000, 10).then(function (socket) {
  console.log('socket initialized!');
  //do something with socket...

  //if you want to use the socket later again and assure that it is still open:
  initWebsocket('ws:\\localhost:8090', socket, 5000, 10).then(function (socket) {
    //if socket is still open, you are using the same "socket" object here
    //if socket was closed, you are using a new opened "socket" object
  })

}, function () {
  console.log('init of socket failed!');
});
*/



export class WsBus {

  private ws: WebSocket;
  private _connected = false;

  public connect(url: string) {
    console.log("ws-bus.connect", url);
    this.ws = new WebSocket(url);
    
    this.ws.addEventListener("message", (event) => {
      window.dispatchEvent(new CustomEvent('event-bus-message', { bubbles: true, composed: true, detail: JSON.parse(event.data) }));
    });

    this.ws.addEventListener("open", () => {
      this._connected = true;
      window.dispatchEvent(new CustomEvent('event-bus-connected', { bubbles: true, composed: true }));
    });

    this.ws.addEventListener("close", () => {
      this._connected = false;
      window.dispatchEvent(new CustomEvent('event-bus-disconnected', { bubbles: true, composed: true }));
    });

    this.ws.addEventListener("onerror", (error) => {
      console.log("***** ws-bus:", error)
      this._connected = false;
      window.dispatchEvent(new CustomEvent('event-bus-disconnected', { bubbles: true, composed: true }));
    });

  }

  public disconnect() {
    this._connected = false;
    if (this.ws) this.ws.close();
  }

  public get connected(): boolean {
    return this._connected;
  }

  public postEvent(msg: any) {
    if (this.connected) {
      try {
        this.ws.send(msg);
      }
      catch {
        console.log("send failed for", msg);
      }
    }
  }

}
