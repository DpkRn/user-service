#stop container
docker stop user-service

#remove container
docker rm user-service

#rerun container
docker run -d \
  --name user-service \
  --network app-net \
  -e DB_HOST=postgres \
  -e DB_USER=myuser \
  -e DB_PASSWORD=mypassword \
  -e DB_NAME=mydb \
  -p 5000:5000 \
  user-service