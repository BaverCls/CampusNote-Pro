import torch
import torch.nn as nn
from typing import List, Dict, Tuple

# Defining the vocabulary and courses
VOCABULARY = [
    # CS101 keywords
    "algorithm", "complexity", "data", "structure", "programming", "variable", "function",
    # ENG101 keywords
    "grammar", "vocabulary", "writing", "essay", "literature", "language",
    # GEN keywords
    "university", "arel", "campus", "note", "study", "academic"
]

COURSES = ["CS101", "ENG101", "GEN"]

class AcademicClassifier(nn.Module):
    """
    A deterministic Multi-Layer Perceptron (MLP) for academic document classification.
    Constructed using PyTorch to calculate quality scores based on keyword density
    and course relevance.
    """
    def __init__(self, vocabulary: List[str] = VOCABULARY, courses: List[str] = COURSES):
        super().__init__()
        self.vocabulary = [w.lower() for w in vocabulary]
        self.courses = courses
        
        vocab_size = len(vocabulary)
        num_courses = len(courses)
        self.input_dim = vocab_size + num_courses
        self.hidden_dim = 16
        self.output_dim = 2  # Class 0: FLAG, Class 1: PUBLISH
        
        # Define layers
        self.fc1 = nn.Linear(self.input_dim, self.hidden_dim, bias=False)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(self.hidden_dim, self.output_dim, bias=True)
        
        # Initialize deterministic weights
        self._initialize_weights()
        
    def _initialize_weights(self):
        # We manually configure weights so that the model behavior is deterministic
        # and represents our course keywords check using PyTorch tensor operations.
        w1 = torch.zeros(self.hidden_dim, self.input_dim)
        vocab_size = len(self.vocabulary)
        
        # CS101 keywords (indices 0..6)
        cs101_kws = ["algorithm", "complexity", "data", "structure", "programming", "variable", "function"]
        for kw in cs101_kws:
            if kw in self.vocabulary:
                idx = self.vocabulary.index(kw)
                w1[0, idx] = 1.0 / len(cs101_kws)
                
        # ENG101 keywords (indices 7..12)
        eng101_kws = ["grammar", "vocabulary", "writing", "essay", "literature", "language"]
        for kw in eng101_kws:
            if kw in self.vocabulary:
                idx = self.vocabulary.index(kw)
                w1[1, idx] = 1.0 / len(eng101_kws)
                
        # GEN keywords (indices 13..18)
        gen_kws = ["university", "arel", "campus", "note", "study", "academic"]
        for kw in gen_kws:
            if kw in self.vocabulary:
                idx = self.vocabulary.index(kw)
                w1[2, idx] = 1.0 / len(gen_kws)
                
        # Course code features:
        # CS101 is at index vocab_size + 0
        # ENG101 is at index vocab_size + 1
        # GEN is at index vocab_size + 2
        # We set negative weights for cross-course codes so that mismatching course active feature
        # results in negative sums that ReLU zeroes out.
        w1[0, vocab_size + 0] = 0.0
        w1[0, vocab_size + 1] = -2.0
        w1[0, vocab_size + 2] = -2.0
        
        w1[1, vocab_size + 0] = -2.0
        w1[1, vocab_size + 1] = 0.0
        w1[1, vocab_size + 2] = -2.0
        
        w1[2, vocab_size + 0] = -2.0
        w1[2, vocab_size + 1] = -2.0
        w1[2, vocab_size + 2] = 0.0
        
        self.fc1.weight = nn.Parameter(w1)
        
        w2 = torch.zeros(self.output_dim, self.hidden_dim)
        b2 = torch.zeros(self.output_dim)
        
        # Class 0 (FLAG): output logit is fixed at 0.0
        w2[0, :] = 0.0
        b2[0] = 0.0
        
        # Class 1 (PUBLISH): logit is 4.479 * active_density - 2.197
        # Mapping density = 0.8 exactly to probability = 0.8 (score = 80)
        # Mapping density = 0.0 exactly to probability = 0.1 (score = 10)
        w2[1, 0:3] = 4.479
        b2[1] = -2.197
        
        self.fc2.weight = nn.Parameter(w2)
        self.fc2.bias = nn.Parameter(b2)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        return out

    def get_matched_signals(self, text: str, course_code: str) -> List[str]:
        """
        Helper method to find which vocabulary keywords are present in the text for the given course.
        """
        lower_text = text.lower()
        if course_code == "CS101":
            kws = ["algorithm", "complexity", "data", "structure", "programming", "variable", "function"]
        elif course_code == "ENG101":
            kws = ["grammar", "vocabulary", "writing", "essay", "literature", "language"]
        else:
            kws = ["university", "arel", "campus", "note", "study", "academic"]
            
        return [kw for kw in kws if kw in lower_text]

    def text_to_features(self, text: str, course_code: str) -> torch.Tensor:
        """
        Converts raw text and course code into the 22-dimensional input feature tensor.
        """
        lower_text = text.lower()
        
        # 1. Bag-of-words keyword features (19 dimensions)
        bow_feat = []
        for kw in self.vocabulary:
            bow_feat.append(1.0 if kw in lower_text else 0.0)
            
        # 2. Course code features (3 dimensions: CS101, ENG101, GEN)
        course_feat = [0.0, 0.0, 0.0]
        if course_code == "CS101":
            course_feat[0] = 1.0
        elif course_code == "ENG101":
            course_feat[1] = 1.0
        else:
            course_feat[2] = 1.0  # Fallback to GEN
            
        features = bow_feat + course_feat
        return torch.tensor(features, dtype=torch.float32)
