package main

import (
	"embed"
	"io/fs"
	"log"

	"infrasight/internal/server"
)

//go:embed dist
var embeddedWeb embed.FS

func main() {
	webFS, err := fs.Sub(embeddedWeb, "dist")
	if err != nil {
		log.Fatal(err)
	}

	if err := server.New(webFS).Listen(); err != nil {
		log.Fatal(err)
	}
}
