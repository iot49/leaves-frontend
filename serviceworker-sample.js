console.log("serviceworker.js loaded!", self);

self.files = [];

self.addEventListener("fetch", function(event) {
  // console.log('self', self);
  const url = event.request.url;
  if (!self.files.includes(url)) {
    console.log("Fetch", url);
    self.files = [...self.files, url];
  }
});
