package main

import (
	"fmt"
	"io"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

var logFile *os.File
var logger = logrus.New()

func init() {
	fmt.Println("INit ...")

	//debug mode for development
	gin.SetMode(os.Getenv("GIN_MODE"))

	//Set up logging
	logFile, err := os.OpenFile("logs/user-service.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		logger.Fatal("Error handling log File: ", err)
	}

	//Set up destination
	fileNStdout := io.MultiWriter(os.Stdout, logFile)
	logger.SetOutput(fileNStdout)

	//Set up format
	logger.SetFormatter(&logrus.JSONFormatter{})

}

func main() {

	//Gin setup
	app := gin.Default()

	port := os.Getenv("PORT")

	logger.Info("Starting Server on: ", port)
	log.Fatal(app.Run(fmt.Sprintf(":%s", port)))

}
