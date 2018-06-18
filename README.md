[![Build Status](https://travis-ci.org/Mathieu-R/streamwave-auth.svg?branch=master)](https://travis-ci.org/Mathieu-R/streamwave-auth)
[![dependencies Status](https://david-dm.org/Mathieu-R/streamwave-auth/status.svg)](https://david-dm.org/Mathieu-R/streamwave-auth)

# streamwave-auth
authentication api for streamwave.

### Usage
```
npm install && NODE_ENV=production node server.js
```

> You need some stuff on your server
- MongoDB

> You need to set some environment variables

`DBURL`: mongo db connection string (https://docs.mongodb.com/manual/reference/connection-string/)

Some credentials for Google Oauth2 : https://console.cloud.google.com/apis/credentials => Create credentials => `id client oauth` + autorize your app domain and your callback url.

`GOOGLEID`: google oauth2 client id.
`GOOGLESECRET`: google oauth2 secret.
`GOOGLECALLBACKPROD`: google oauth2 callback.

`JWT_SECRET`: strong secret for JSON WEB TOKEN.
`MAIL_HOST_PROD`: host url for mail (ex: smtp.example.com).
`MAIL_PORT_PROD`: smtp port for mail.
`MAIL_USER_PROD` and `MAIL_PASSWORD_PROD`: credentials of the email that will send the emails (account verification, password forgotten,...).
