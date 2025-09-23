

```cmd
    touch .env
```


VITE_API_URL=http://localhost:4000
VITE_API_WS_URL=ws://localhost:4000
VITE_API_URL_BUCKETS=http://<public_accesible_domain>:80
VITE_API_WS_URL=ws://localhost:4000


> Team server in port 4000 shouldn't be forwarded and exposed into internet, use ssh port forwarding for local access instead.


```cmd
    npm run build
```
