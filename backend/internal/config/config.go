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
	db := getenv("INFRASIGHT_DB", "")
	if db == "" {
		db = getenv("DB_PATH", "infrasight.db")
	}
	return Config{
		Port: getenv("PORT", "8080"),
		DB:   db,
	}
}

func getenv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}
