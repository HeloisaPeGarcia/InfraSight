package config

import (
	"os"
	"strings"
)

type Config struct {
	Port string
	DB   string
}

func Load() Config {
	return Config{
		Port: getenv("PORT", "8080"),
		DB:   getenv("INFRASIGHT_DB", "infrasight.db"),
	}
}

func getenv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}
