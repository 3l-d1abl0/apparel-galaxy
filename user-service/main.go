package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
)

func init() {
	fmt.Println("INit ...")
}

func main() {

	//Gin setup
	app := gin.Default()

	log.Fatal(app.Run(":8090"))
}
