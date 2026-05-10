# Work It setup
Fordi vi har en backend og en webserver som begge modtager traffik på samme domæne, bruger vi nginx til at dele det op.

Installér nginx og indsæt følgende konfiguration:

Alle requests, som starter med /api bliver sendt til port 4000, mens alt andet bliver sendt til port 3000.

```
worker_processes 1;

events {
  worker_connections 1024;
}

http {
  server {
    listen 80;
    server_name localhost;

    location /api {
      proxy_pass http://localhost:4000;
    }

    location /api/ws {
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Host $http_host;
      proxy_set_header X-NginX-Proxy false;

      proxy_pass http://localhost:4000;
      proxy_redirect off;

      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location / {
      proxy_pass http://localhost:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  }
}
```
