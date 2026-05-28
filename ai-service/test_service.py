from fastapi.testclient import TestClient
from service import app

client = TestClient(app)

def test_evaluate_positive_cs101():
    payload = {
        "documentId": 10,
        "courseCode": "CS101",
        "text": "This algorithm explains data structure and complexity in programming functions. Istanbul Arel University academic notes."
    }
    response = client.post("/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["documentId"] == 10
    assert data["score"] >= 80
    assert data["decision"] == "PUBLISH"
    assert data["confidence"] > 0.5
    assert len(data["matchedSignals"]) > 0
    assert "algorithm" in data["matchedSignals"]
    assert "data" in data["matchedSignals"]

def test_evaluate_negative_irrelevant():
    payload = {
        "documentId": 11,
        "courseCode": "CS101",
        "text": "Lunch menu, parking reminder, and unrelated social announcement."
    }
    response = client.post("/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["documentId"] == 11
    assert data["score"] < 80
    assert data["decision"] == "FLAG"
    assert data["confidence"] > 0.5
    assert len(data["matchedSignals"]) == 0

def test_evaluate_schema():
    payload = {
        "documentId": 42,
        "courseCode": "GEN",
        "text": "Academic notes and university campus study."
    }
    response = client.post("/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Verify all expected keys exist in the response
    expected_keys = ["documentId", "score", "decision", "confidence", "matchedSignals", "modelVersion"]
    for key in expected_keys:
        assert key in data
        
    assert isinstance(data["documentId"], int)
    assert isinstance(data["score"], int)
    assert data["decision"] in ["PUBLISH", "FLAG"]
    assert isinstance(data["confidence"], float)
    assert isinstance(data["matchedSignals"], list)
    assert isinstance(data["modelVersion"], str)
