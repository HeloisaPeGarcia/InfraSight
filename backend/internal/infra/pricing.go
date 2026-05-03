package infra

import "infrasight/internal/domain"

var Pricing = map[string]int{
	"t2.micro":        8,
	"t3.micro":        7,
	"e2-micro":        6,
	"f1-micro":        5,
	"B1s":             7,
	"Standard_B1s":    7,
	"db.t3.micro":     15,
	"Standard_DS1_v2": 19,
}

func ApplyCosts(resources []domain.Resource) {
	for index := range resources {
		if resources[index].MonthlyCost == 0 && resources[index].InstanceClass != "" {
			resources[index].MonthlyCost = Pricing[resources[index].InstanceClass]
		}
	}
}
