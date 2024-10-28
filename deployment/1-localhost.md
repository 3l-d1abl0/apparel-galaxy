# Deploying on localhost


**Please visit the envs/ folder for every service for checking the configs needed for each Service inorder for this to Work. Update the values as per your needs**

  

### 1. Auth Service

  

Head over to `auth-service/`

```

python3 -m venv env-auth-service    #Create a virtual environment if needed
source env-auth-service/bin/activate    #Active the virtual environment
pip3 install -r requirement.txt     #Insall the dependencies
export $(cat envs/.env | xargs) && env      #Export the environment variables

p3 auth-service/app/main.py     #Run the FastAPI Server

```

Visit :[PORT] for Auth Service

  
  

### 2.Product Service

  

Head over to `product-service/`

```
npm install
npm run build
export $(cat envs/.env | xargs) && env      #Export the environment variables
npm run start

```

Visit :[PORT] for Product Service

  

### 3. Order Service


Head over to `order-service/`

```

python3 -m venv env-order-service    #Create a virtual environment if needed
source env-order-service/bin/activate    #Active the virtual environment
pip3 install -r requirement.txt     #Insall the dependencies
export $(cat envs/.env | xargs) && env      #Export the environment variables

p3 order-service/app/main.py     #Run the FastAPI Server

```

Visit :[PORT] for Order Service

  

### 4. Cart Service

  

Head over to `cart-service/`

```

npm install
npm run build
export $(cat envs/.env | xargs) && env      #Export the environment variables
npm run start

```

Visit :[PORT] for Order Service

  
  

### 5. WIP : User Service
