import markdown
from bs4 import BeautifulSoup

def markdown_to_plaintext(md_text):
    html = markdown.markdown(md_text)
    plaintext = '\n'.join(BeautifulSoup(html, "html.parser").stripped_strings)
    return plaintext

from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
from typing import Optional, Tuple, Dict
from dataclasses import dataclass
from collections import OrderedDict
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"  # or "true" based on your requirements

@dataclass
class SimilarityMatch:
    """Class to hold similarity search results"""
    text: str
    index: int
    similarity: float
    vector: np.ndarray

class TextVectorizer:
    """
    A fast text vectorization class that maintains model in memory and stores embeddings.
    """
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
                 similarity_threshold: float = 0.85,
                 max_stored_embeddings: int = 10000):
        """Initialize the vectorizer with specified model"""
        # Load model and tokenizer once during initialization
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)

        # Move model to GPU if available
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self.model.to(self.device)

        # Set model to evaluation mode
        self.model.eval()

        # Store model dimensions
        self.vector_size = self.model.config.hidden_size

        # Initialize embedding storage with OrderedDict to maintain insertion order
        self.stored_embeddings: OrderedDict[int, np.ndarray] = OrderedDict()
        self.texts = []
        self.deck = ""
        self.max_stored_embeddings = max_stored_embeddings
        self.similarity_threshold = similarity_threshold

    def clear(self):
        self.stored_embeddings: OrderedDict[int, np.ndarray] = OrderedDict()
        self.texts = []
        self.deck = ""

    @torch.no_grad()
    def encode(self, text: str) -> np.ndarray:
        """Convert input text to vector quickly."""
        # Tokenize
        inputs = self.tokenizer(
            text,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt"
        ).to(self.device)

        # Generate embeddings
        outputs = self.model(**inputs)

        # Get embedding (CLS token) and convert to numpy
        embedding = outputs.last_hidden_state[:, 0, :].cpu().numpy()
        return embedding[0]

    def encode_batch(self, texts: list[str], batch_size: int = 32) -> np.ndarray:
        """Vectorize a batch of texts efficiently."""
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            # Tokenize batch
            inputs = self.tokenizer(
                batch,
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors="pt"
            ).to(self.device)

            # Generate embeddings
            with torch.no_grad():
                outputs = self.model(**inputs)

            # Get embeddings and convert to numpy
            embeddings = outputs.last_hidden_state[:, 0, :].cpu().numpy()
            all_embeddings.append(embeddings)

        return np.vstack(all_embeddings)

    def add_text(self, index: int, text: str, vector: Optional[np.ndarray] = None) -> None:
        """
        Add a text and its embedding to storage.

        Args:
            text (str): Text to store
            vector (Optional[np.ndarray]): Pre-computed vector, or None to compute now
            :param vector:
            :param text:
            :param index:
        """
        if len(self.stored_embeddings) >= self.max_stored_embeddings:
            # Remove oldest item when at capacity
            self.stored_embeddings.popitem(last=False)

        # Compute vector if not provided
        if vector is None:
            vector = self.encode(text)

        self.stored_embeddings[index] = vector
        self.texts.append(text)

    def add_texts(self, texts: list[str]) -> None:
        """
        Add multiple texts efficiently using batch processing.

        Args:
            texts (list[str]): List of texts to add
        """
        vectors = self.encode_batch(texts)
        offset = len(self.texts)
        for key, (text, vector) in enumerate(zip(texts, vectors)):
            self.add_text(key + offset, text, vector)

    def set_deck(self, deck: str):
        self.deck = deck

    def get_deck(self):
        return self.deck

    def find_most_similar(self, query: str) -> Optional[SimilarityMatch]:
        """
        Find the most similar stored text to the query text.
        Returns None if no text meets the similarity threshold.

        Args:
            query (str): Text to find matches for

        Returns:
            Optional[SimilarityMatch]: Best match if found, None if no good matches
        """
        if not self.stored_embeddings:
            return None

        query_vector = self.encode(query)

        # Compute similarities with all stored embeddings
        best_similarity = -1
        best_match = None

        for index, stored_vector in self.stored_embeddings.items():
            similarity = np.dot(query_vector, stored_vector) / (
                np.linalg.norm(query_vector) * np.linalg.norm(stored_vector)
            )

            if similarity > best_similarity:
                best_similarity = similarity
                best_match = SimilarityMatch(
                    text=self.texts[index],
                    index=index,
                    similarity=similarity,
                    vector=stored_vector
                )

        # Return None if best match doesn't meet threshold
        if best_match and best_match.similarity > self.similarity_threshold:
            return best_match
        return None

    def find_similar_texts(self, query: str, top_k: int = 5) -> list[SimilarityMatch]:
        """
        Find top-k similar stored texts to the query text.
        Only returns matches above the similarity threshold.

        Args:
            query (str): Text to find matches for
            top_k (int): Maximum number of matches to return

        Returns:
            list[SimilarityMatch]: List of top matches, sorted by similarity
        """
        if not self.stored_embeddings:
            return []

        query_vector = self.encode(query)
        matches = []

        for index, stored_vector in self.stored_embeddings.items():
            similarity = np.dot(query_vector, stored_vector) / (
                np.linalg.norm(query_vector) * np.linalg.norm(stored_vector)
            )

            if similarity >= self.similarity_threshold:
                matches.append(SimilarityMatch(
                    text=self.texts[index],
                    index=index,
                    similarity=similarity,
                    vector=stored_vector
                ))

        # Sort by similarity and return top-k
        matches.sort(key=lambda x: x.similarity, reverse=True)
        return matches[:top_k]

# Example usage
if __name__ == "__main__":
    # Initialize vectorizer
    vectorizer = TextVectorizer()
    print(f"Model loaded on: {vectorizer.device}")
    print(f"Vector size: {vectorizer.vector_size}")

    # Add some example texts
    texts = [
        "I love programming in Python",
        "Machine learning is fascinating",
        "The weather is nice today",
        "Neural networks are powerful",
        "I enjoy coding and software development"
    ]
    print("\nAdding example texts...")
    vectorizer.add_texts(texts)

    # Example 1: Find most similar text
    query = "I really"
    match = vectorizer.find_most_similar(query)
    print(f"\nQuery: {query}")
    if match:
        print(f"Best match: '{match.text}' (similarity: {match.similarity:.3f})")
    else:
        print("No similar texts found above threshold")

    # Example 2: Find multiple similar texts
    query = "Deep learning and neural nets"
    matches = vectorizer.find_similar_texts(query, top_k=3)
    print(f"\nQuery: {query}")
    print("Top matches:")
    for match in matches:
        print(f"- '{match.text}' (similarity: {match.similarity:.3f})")

    # Example 3: Query with no good matches
    query = "Something completely different and unrelated"
    match = vectorizer.find_most_similar(query)
    print(f"\nQuery: {query}")
    if match:
        print(f"Best match: '{match.text}' (similarity: {match.similarity:.3f})")
    else:
        print("No similar texts found above threshold")