import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from model import AcademicClassifier

app = FastAPI(title="CampusNote Pro AI Quality Service")
model = AcademicClassifier()

class EvaluateRequest(BaseModel):
    documentId: int
    courseCode: str
    text: str

class EvaluateResponse(BaseModel):
    documentId: int
    score: int
    decision: str
    confidence: float
    matchedSignals: List[str]
    modelVersion: str = "pytorch-demo-v1"

@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate_document(req: EvaluateRequest):
    try:
        # Preprocess text to tensor features
        features = model.text_to_features(req.text, req.courseCode)
        
        # Add batch dimension and run forward pass
        # features shape is [22], we unsqueeze to [1, 22]
        x = features.unsqueeze(0)
        
        with torch.no_grad():
            logits = model(x).squeeze(0)  # Shape [2]
            probs = torch.softmax(logits, dim=0)
            
        prob_publish = probs[1].item()
        
        # Calculate score (0-100)
        score = int(round(prob_publish * 100))
        # Clamp between 0 and 100 just in case
        score = max(0, min(100, score))
        
        # Decision logic: publish threshold is 80
        decision = "PUBLISH" if score >= 80 else "FLAG"
        
        # Confidence is the probability of the predicted class
        confidence = round(max(probs[0].item(), probs[1].item()), 4)
        
        # Matched signals represent relevant keywords
        matched_signals = model.get_matched_signals(req.text, req.courseCode)
        
        return EvaluateResponse(
            documentId=req.documentId,
            score=score,
            decision=decision,
            confidence=confidence,
            matchedSignals=matched_signals,
            modelVersion="pytorch-demo-v1"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Evaluation Error: {str(e)}")
