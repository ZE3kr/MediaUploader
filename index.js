const account_id = 'd41d8cd98f00b204e9800998ecf8427e'
const auth = 'Bearer :token'
const image_user_id = '6T-behmofKYLsxlrK0l_MQ'

const head = `
  <meta charset="UTF-8">
  <title>Media Uploader</title>
  <meta name="viewport" content="width=device-width, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, initial-scale=1, viewport-fit=cover">
  <style>
    body,
    button,
    input,
    optgroup,
    select {
      font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
    }

    #list {
      list-style-type: none;
      padding-inline-start: 0;
      display: flex;
      flex-wrap: wrap;
      margin: -12px -24px;
    }
    #list li {
      padding: 10px;
    }
    #list li img {
      cursor: pointer;
    }
  </style>
`

const scripts = `
  function _(el) {
    return document.getElementById(el);
  }

  function progressHandler(event) {
    var percent = (event.loaded / event.total) * 100;
    _("progressBar").value = Math.round(percent);
    _("description").innerHTML = Math.round(percent) + "% uploaded... please wait";
  }

  function completeHandler(event) {
    var json = {}
    try {
      json = JSON.parse(event.target.responseText);
    } catch(_) {}
    
    if (json.success) {
      location.reload();
    } else {
      _("description").innerText = event.target.responseText;
      location.reload();
    }
    _("progressBar").value = 0; //wil clear progress bar after successful upload
  }

  function errorHandler(event) {
    _("status_title").innerText = 'Upload Failed';
    _("status_title").style.color = "red"
  }

  function abortHandler(event) {
    _("status_title").innerHTML = "Upload Aborted";
    _("status_title").style.color = "red"
  }
`

async function images() {
  const json = await fetch('https://api.cloudflare.com/client/v4/accounts/' + account_id + '/images/v2/direct_upload', { 
    method: 'post', 
    headers: new Headers({
        'Authorization': auth, 
        'Content-Type': 'application/json'
    })
  }).then(response => response.json());

  if (!json.success) {
    return false;
  }

  const list = await fetch('https://api.cloudflare.com/client/v4/accounts/' + account_id + '/images/v1?page=1&per_page=100', { 
    method: 'get', 
    headers: new Headers({
        'Authorization': auth, 
        'Content-Type': 'application/json'
    })
  }).then(response => response.json());

  if (!list.success) {
    return false;
  }

  const varients = await fetch('https://api.cloudflare.com/client/v4/accounts/' + account_id + '/images/v1/variants', { 
    method: 'get', 
    headers: new Headers({
        'Authorization': auth, 
        'Content-Type': 'application/json'
    })
  }).then(response => response.json());

  if (!varients.success) {
    return false;
  }

  let smallest_name = ''
  let smallest_size = 100000000
  const default_size = Object.keys(varients.result.variants).sort()[0]

  for (const [_, varient] of Object.entries(varients.result.variants)) {
    if (varient.options?.width > 0 && varient.options.width < smallest_size) {
      smallest_size = varient.options.width
      smallest_name = varient.id
    }
  }

  console.log(varients)

  return `<!DOCTYPE html><head>
  ${head}
</head>
<body style="margin: 24px;">
<p><a href="/video/">Videos</a></p>
  <form id="upload_form" enctype="multipart/form-data" method="post">
    <input type="file" name="file" id="file1" onchange="uploadFile()"><br>
    <progress id="progressBar" value="0" max="100" style="width:300px;"></progress>
    <h3 id="status_title"></h3>
    <div id="description"></div>
    <textarea onclick="this.focus();this.select()" id="status" style="width: 300px;height: 7em;display: block;"></textarea>
  </form>
  <p>
    <h3>Recent Images</h3>
    <ul id="list">${list.result.images.map(image => `<li><img data-filename="${image.filename}" id="${image.id}" width="100" src="https://imagedelivery.net/${image_user_id}/${image.id}/${smallest_name}" /></li>`).join('')}</ul>
  </p>
  <script>
  ${scripts}
  function uploadFile() {
    var file = _("file1").files[0];
    // alert(file.name+" | "+file.size+" | "+file.type);
    var formdata = new FormData();
    formdata.append("file", file);
    var ajax = new XMLHttpRequest();
    ajax.upload.addEventListener("progress", progressHandler, false);
    ajax.addEventListener("load", completeHandler, false);
    ajax.addEventListener("error", errorHandler, false);
    ajax.addEventListener("abort", abortHandler, false);
    ajax.open("POST", "${json.result.uploadURL}");
    ajax.send(formdata);
  }

  function fillImg(id, name) {
    _("description").innerHTML = \`<img style="object-fit: contain; width: 200px; height: 200px; max-width: 33vw; max-height: 33vw; float: left; margin: 0 10px 0 -10px;" src="https://imagedelivery.net/${image_user_id}/\${id}/${default_size}" />
      <p>The following varients are the permanent links for public:</p>
      <p>
        ${Object.entries(varients.result.variants).map(([_, val]) => `<a href="https://imagedelivery.net/${image_user_id}/\${id}/${val.id}" target="_blank">${val.options?.width}px</a>`).join(' | ')}
      </p>
      <p>Please use the following code to insert the image to your post:</p>\`;
    name = name || _("file1").files[0].name.split('.').slice(0, -1).join('.')
    _("status").innerText = '![' + name + '](/cdn-cgi/imagedelivery/${image_user_id}/' + id + '/${default_size})';
  }

  document.querySelectorAll('#list li img').forEach(img => img.onclick = () => { fillImg(img.id, img.dataset.filename); scroll(0,0) } )
  let img = document.querySelector('#list li img')
  fillImg(img.id, img.dataset.filename)
  </script>
</body>`;
}

async function videos_list() {
  const list = await fetch('https://api.cloudflare.com/client/v4/accounts/' + account_id + '/stream?limit=1000', { 
    method: 'get', 
    headers: new Headers({
        'Authorization': auth, 
        'Content-Type': 'application/json'
    })
  }).then(response => response.json());

  if (!list.success) {
    return false;
  }

  return `<!DOCTYPE html><head>
  ${head}
  <style>li {margin-bottom: 0.5em;}</style>
</head>
<body style="margin: 24px;">
<p><a href="/video/new/">New video</a> | <a href="/">New photo</a></p>

  <p>
    <h3>Recent Videos</h3>
    <ul>${list.result.map(video => `<li>${video.status.state}: <a class="video-date" href="/video/${video.uid}">${video.created}</a> ${video.meta.name}</li>`).join('')}</ul>
  </p>
  <script>document.querySelectorAll('.video-date').forEach(date => date.innerText = (new Date(date.innerText)).toLocaleString())</script>
</body>`;
}

async function videos(id) {
  const detail = await fetch('https://api.cloudflare.com/client/v4/accounts/' + account_id + '/stream/' + id, { 
    method: 'get', 
    headers: new Headers({
        'Authorization': auth, 
        'Content-Type': 'application/json'
    })
  }).then(response => response.json());

  if (!detail.success) {
    return false;
  }

  return `<!DOCTYPE html><head>
  ${head}
  ${detail.result?.status?.state === 'inprogress' || detail.result?.status?.state === 'queued' ? `
    <meta http-equiv="refresh" content="5" >
` : ''}
</head>
<body style="margin: 24px;">
<p><a href="/video/">Videos</a></p>
  <form id="upload_form" enctype="multipart/form-data" method="post">
${detail.result?.status?.state === 'pendingupload' ? `
    <input type="file" name="file" id="file1" onchange="uploadFile()"><br>
    <progress id="progressBar" value="0" max="100" style="width:300px;"></progress>
    <div id="description"></div>
` : ''}
    <h3 id="status_title">${detail.result?.status?.state} ${detail.result?.status?.errorReasonText}</h3>
${detail.result?.status?.state === 'inprogress' ? `
    <progress id="progressBar" value="${detail.result?.status?.pctComplete}" max="100" style="width:300px;"></progress>
    <div id="description">${detail.result?.status?.pctComplete}% processed... please wait.</div>
` : ''}
${detail.result?.status?.state === 'queued' ? `
    <div id="description">Uploaded successful. please wait for processing.</div>
` : ''}
${detail.result?.status?.state === 'ready' ? `
<figure style="width: 400px; max-width: 80vw; margin: 0">
  <div style="position: relative; padding-top: ${detail.result?.input?.height / detail.result?.input?.width * 100}%;"><iframe src="https://iframe.videodelivery.net/${ id }?preload=metadata&poster=${encodeURIComponent("https://videodelivery.net/" + id + "/thumbnails/thumbnail.jpg?height=600")}" style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe></div>
  <figcaption>${detail.result?.meta?.name}</figcaption>
</figure>
<h4>Video ID</h4>
<textarea onclick="this.focus();this.select()" style="width: 300px;height: 2em;display: block;">${id}</textarea>
    <h4>Default version</h4>
    <textarea onclick="this.focus();this.select()" style="width: 300px;height: 20em;display: block;"><figure>
  <div style="position: relative; padding-top: ${detail.result?.input?.height / detail.result?.input?.width * 100}%;"><iframe src="https://iframe.videodelivery.net/${ id }?preload=metadata&poster=${encodeURIComponent("https://videodelivery.net/" + id + "/thumbnails/thumbnail.jpg?height=600")}" style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe></div>
  <figcaption>${detail.result?.meta?.name}</figcaption>
</figure></textarea>
    <h4>Autoplay version (muted & loop)</h4>
    <textarea onclick="this.focus();this.select()" style="width: 300px;height: 20em;display: block;"><figure>
  <div style="position: relative; padding-top: ${detail.result?.input?.height / detail.result?.input?.width * 100}%;"><iframe src="https://iframe.videodelivery.net/${ id }?controls=false&muted=true&preload=metadata&loop=true&autoplay=true&poster=${encodeURIComponent("https://videodelivery.net/" + id + "/thumbnails/thumbnail.jpg?height=600")}" style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe></div>
  <figcaption>${detail.result?.meta?.name}</figcaption>
</figure></textarea>
` : ''}
  </form>
  <script>
  ${scripts}
  function uploadFile() {
    var file = _("file1").files[0];
    // alert(file.name+" | "+file.size+" | "+file.type);
    var formdata = new FormData();
    formdata.append("file", file);
    var ajax = new XMLHttpRequest();
    ajax.upload.addEventListener("progress", progressHandler, false);
    ajax.addEventListener("load", completeHandler, false);
    ajax.addEventListener("error", errorHandler, false);
    ajax.addEventListener("abort", abortHandler, false);
    ajax.open("POST", "https://upload.videodelivery.net/${id}");
    ajax.send(formdata);
  }
  </script>
</body>`;
}

async function handleRequest(request) {
  let html = false
  if (request.url.endsWith('/video/new/')) {
    const json = await fetch('https://api.cloudflare.com/client/v4/accounts/' + account_id + '/stream/direct_upload', { 
      method: 'post', 
      headers: new Headers({
          'Authorization': auth, 
          'Content-Type': 'application/json'
      }),
      body: '{"maxDurationSeconds":1800}'
    }).then(response => response.json());
    return Response.redirect(request.url + json.result.uid, 302);
  } else if (request.url.includes('/video/') && request.url.split('/').slice(-1)[0].length === 32) {
    const uid = request.url.split('/').slice(-1)[0]
    html = await videos(uid)
  } else if (request.url.endsWith('/video/')) {
    html = await videos_list()
  } else {
    html = await images()
  }
  
  if (!html) {
    return new Response('API Error', { status: 403 });
  }

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
}

addEventListener('fetch', event => {
  return event.respondWith(handleRequest(event.request));
});
