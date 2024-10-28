# Deploying on single host using Docker

  

Create a docker network if all services are meant to run on the same host.

  

```

docker network create network-apparel-galaxy

```

  

**Please visit the envs/ folder for every service for checking the configs needed for each Service inorder for this to Work. Update the values as per your needs**

  

### 1. Auth Service

  

Head over to `auth-service/`

```

docker build -t apparel-galaxy-auth-service -f builds/dockerfile .

docker run -d --env-file envs/.env -p 8000:8000 apparel-galaxy-cart-service

docker network connect network-apparel-galaxy apparel-galaxy-auth-service

```

Visit :8000 for Auth Service

  
  

### 2.Product Service

  

Head over to `product-service/`

```

docker build -t apparel-galaxy-product-service -f builds/dockerfile .

docker run -d --env-file envs/.env -p 8080:8080 apparel-galaxy-product-service

docker network connect network-apparel-galaxy apparel-galaxy-product-service

```

Visit :8080 for Product Service

  

### 3. Order Service

  

Head over to `order-service/`

```

docker build -t apparel-galaxy-order-service -f builds/dockerfile .

docker run -d --env-file envs/.env -p 8089:8089 apparel-galaxy-order-service

docker network connect network-apparel-galaxy apparel-galaxy-order-service

```

Visit :8080 for Order Service

  

### 4. Cart Service

  

Head over to `cart-service/`

```

docker build -t apparel-galaxy-cart-service -f builds/dockerfile .

docker run -d --env-file envs/.env -p 8088:8088 apparel-galaxy-cart-service

docker network connect network-apparel-galaxy apparel-galaxy-cart-service

```

Visit :8088 for Order Service

  
  

### 5. WIP : User Service
