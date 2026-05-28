# CampusNote Pro - PyTorch AI Quality Evaluation Microservice

This is a Python-based microservice that evaluates academic document quality and relevance using a deterministic PyTorch Multi-Layer Perceptron (MLP) model.

## Overview

The service exposes a FastAPI HTTP server on port 9000. It accepts PDF extracted text, course code, and document metadata, and computes:
1. **Relevance Score (0-100)**: Softmax probability map based on deterministic PyTorch tensor operations.
2. **Decision**: `PUBLISH` (if score >= 80) or `FLAG` (if score < 80).
3. **Confidence**: Probability of the decided class.
4. **Matched Signals**: Course-specific keywords matched in the text.

## Running the Service

### Prerequisites

- Python 3.8 or higher.
- `pip` or another package manager.

### 1. Installation

Install dependencies:

```bash
pip install -r requirements.txt
```

### 2. Run the Server

Start the FastAPI application with Uvicorn:

```bash
python -m uvicorn service:app --host 127.0.0.1 --port 9000
```

The service will be available at `http://localhost:9000/evaluate`.

## Running Tests

Verify the service using pytest:

```bash
pytest
```
