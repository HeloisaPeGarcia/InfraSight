package infra

import "testing"

func TestParseTerraformStateBuildsResourcesEdgesAndFindings(t *testing.T) {
	data := []byte(`{
	  "resources": [
	    {
	      "address": "aws_subnet.public_a",
	      "mode": "managed",
	      "type": "aws_subnet",
	      "name": "public_a",
	      "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
	      "instances": [{
	        "attributes": {
	          "availability_zone": "us-east-1a",
	          "tags": {"Name": "public-a", "Environment": "prod"}
	        },
	        "dependencies": []
	      }]
	    },
	    {
	      "address": "aws_instance.api",
	      "mode": "managed",
	      "type": "aws_instance",
	      "name": "api",
	      "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
	      "instances": [{
	        "attributes": {"instance_type": "t2.micro", "tags": {"Name": "api-01", "Owner": "payments"}},
	        "dependencies": ["aws_subnet.public_a"]
	      }]
	    }
	  ]
	}`)

	snapshot, err := ParseTerraformState(data)
	if err != nil {
		t.Fatalf("ParseTerraformState returned error: %v", err)
	}
	if len(snapshot.Resources) != 2 {
		t.Fatalf("expected 2 resources, got %d", len(snapshot.Resources))
	}
	if len(snapshot.Edges) != 1 {
		t.Fatalf("expected 1 edge, got %d", len(snapshot.Edges))
	}
	if snapshot.Resources[1].MonthlyCost != 8 {
		t.Fatalf("expected t2.micro cost to be applied")
	}
	if len(snapshot.Findings) == 0 {
		t.Fatalf("expected policy findings")
	}
}
