// Example browser-style request shape. Fill values from isrc-company/config/.env (gitignored):
//   SPOTIFY_WEB_AUTHORIZATION, SPOTIFY_WEB_CLIENT_TOKEN, SPOTIFY_SPCLIENT_TRACK_URL_TEMPLATE ({gid} → track hex id)
fetch("<TRACK_METADATA_URL_FROM_LOCAL_ENV>", {
  "headers": {
    "accept": "application/json",
    "accept-language": "tr",
    "app-platform": "WebPlayer",
    "authorization": "<SPOTIFY_WEB_AUTHORIZATION>",
    "client-token": "<SPOTIFY_WEB_CLIENT_TOKEN>",
    "if-none-match": "\"MC-CnwhKQ==\"",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "spotify-app-version": "1.2.63.66.ge5825bf3"
  },
  "referrer": "https://open.spotify.com/",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
