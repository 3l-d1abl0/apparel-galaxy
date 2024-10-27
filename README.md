# Apparel Galaxy

Apparel Galaxy is a simple e-commerce APIs built using microservice Architecture. It queries apparel stored over MongoDB Cloud.
User can create account and browser products and Order them.
Can be deployed over localhost or cloud using containers (Docker/Kubernetes)
I have personally deployed it via AWS Fargate on ECS Clusters.

Following Diagram is just an illustration on AWS ECS Architecture:
![ECS Architecture](https://github.com/3l-d1abl0/apparel-galaxy/blob/dad542c170363f730902dc4903449adb67b1dbef/images/overview-fargate.png)
Image Source [AWS](https://docs.aws.amazon.com/images/AmazonECS/latest/developerguide/images/overview-fargate.png)


Apparel Galaxy's overall architecture when deployed on ECS would look like:
![Apprel-Galaxy](https://github.com/3l-d1abl0/apparel-galaxy/blob/b169be13d6937b4ecd9e61523b39179380987aff/images/apparel-galaxy-service.drawio.png)

Following is the breakdown of the the Services:
### 1. Auth Service
Authentication Service handles the authentication and authorization of user over the e-commerce platform. It uses Json Web Token (JWT) grant identity to user once they are registered to the Platform. It exposes the following endpoints:

- GET /ping
	returns a 'pong' from the service
- POST /register
	Registers the user onto the Platform.
- POST /login
	logs the valid user onto the System. Returns a token in return.
- POST /onboard
	Registers a user onto the Platform as a Admin

> More details on the AuthService README
	

### 2. Product Service
Product Service handles all the request handling the queries for Products. It exposes the following endpoints:

- GET /PING
	returns a 'pong' from the service
- GET /products/search
	search for products with a specific query
- GET /products
	browse products
- GET /products/< id>
	get a particular product with an ID

> More details on the ProductService README

### 3. Order Service
Order Service is responsible for serving order details for users and handle order request. Verification of order after failure/success of Payment.

- GET /ping
	returns a 'pong' from the service
- GET /orders
	lists the past orders for a user
- GET /orderFailure
	handles the process when an payment fails
- GET /orderSuccess
	handles the process when the payment fails
	
> More details on the OrderService README

### 4. Cart Service
Cart Service is responsible for handling user's cart operation and checking out the cart for order.

- GET /ping
	returns a 'pong' from the service
- GET /cart
	fetches the cart content for the users
- POST /cart
	handles addition of items to the cart.
- DELETE /cart
	handles the deletion of items from cart or deletion of entire Cart.
	
> More details on the CartService README


## Built Using

- Python v3.12.4
- FastAPI v0.114
- NodeJS v21.7.3
- Express v4.21.0
- Typescript v5.6.2
- Golang v1.22.0
- Gin-Goinc v1.10.0
- MongoDB Cloud