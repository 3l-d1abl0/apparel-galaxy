package middlewares

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func JWTAuthMiddleware(logger *logrus.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {

		//0. Get the needful
		if os.Getenv("JWT_SECRET") == "" {
			logger.Error("JWT_SECRET_KEY must be set")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
			c.Abort()
			return
		}
		jwtSecret := os.Getenv("JWT_SECRET")

		if os.Getenv("JWT_ALGORITHM") == "" {
			logger.Error("JWT_ALGORITHM must be set")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
			c.Abort()
			return
		}
		jwtAlgorithm := os.Getenv("JWT_ALGORITHM")

		//1. extract the auth header
		authHeader := c.GetHeader("Authorization")
		fmt.Println("Extract AUTH Header: ", authHeader)
		if authHeader == "" {
			logger.Error("Auth Header missing")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		//2. Check for bearer value
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			logger.Error("Bearer Token missing!")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Authorization header format"})
			c.Abort()
			return
		}

		authToken := tokenParts[1]

		//3. Parse and validate the JWT token
		token, err := jwt.Parse(authToken, func(token *jwt.Token) (interface{}, error) {

			// Validate that the algorithm matches the expected one
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				logger.Errorf("unexpected signing method: %v", token.Header["alg"])
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}

			// Check if the algorithm matches the one from env
			if token.Method.Alg() != jwtAlgorithm {
				logger.Errorf("unexpected signing method: %v", token.Method.Alg())
				return nil, fmt.Errorf("unexpected signing method: %v", token.Method.Alg())
			}

			// Return the secret key for validation
			//return jwtSecret, nil
			return []byte(jwtSecret), nil
		})

		// Handle parsing errors or invalid token
		if err != nil || !token.Valid {
			logger.Error("Invalid token", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// You can add custom claims validation here if needed
			// For example, checking expiration time, issuer, etc.

			logger.Info(claims)

			// Add claims to the context for use in subsequent handlers
			c.Set("claims", claims)
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

	}
}
