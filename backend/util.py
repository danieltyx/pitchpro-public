import json

def check_sentence_similarity(first: str, second: str) -> tuple[bool, float, dict]:
    """
    Check if second sentence contains the first sentence, with some flexibility.
    The similarity is primarily based on matching the words from the first input.

    Parameters:
    first (str): First sentence (base for comparison)
    second (str): Second sentence (can be longer)

    Returns:
    tuple[bool, float, dict]: (is_similar, match_score, match_details)
    """
    def clean_sentence(sentence: str) -> list[str]:
        """Clean and tokenize a sentence."""
        return [word.strip().lower() for word in sentence.strip().split()
                if word.strip()]

    def word_similarity(word1: str, word2: str) -> float:
        """Calculate similarity between two words."""
        len1, len2 = len(word1), len(word2)
        if len1 == 0 or len2 == 0:
            return 0.0

        # Count matching characters in sequence
        matches = 0
        i = j = 0
        while i < len1 and j < len2:
            if word1[i] == word2[j]:
                matches += 1
                i += 1
                j += 1
            elif len1 > len2:
                i += 1
            else:
                j += 1

        return matches / len1  # Note: Using len1 specifically, not max length

    # Clean and tokenize sentences
    words1 = clean_sentence(first)
    words2 = clean_sentence(second)

    # Handle empty inputs
    if not words1:
        return True, 1.0, {"matches": [], "unmatched": []}
    if not words2:
        return False, 0.0, {"matches": [], "unmatched": words1}

    # Track matched words and their similarities
    matched_pairs = []
    unmatched_words = []

    # For each word in first sentence, find best matching word in second sentence
    for word1 in words1:
        best_match = None
        best_score = 0.7  # Threshold for word matching

        # Look for this word in the beginning portion of second sentence
        search_range = min(len(words2), len(words1) + 2)  # Allow some flexibility in position
        for word2 in words2[:search_range]:
            score = word_similarity(word1, word2)
            if score > best_score:
                best_score = score
                best_match = word2

        if best_match:
            matched_pairs.append((word1, best_match, best_score))
        else:
            unmatched_words.append(word1)

    # Calculate similarity score based only on first sentence words
    match_score = len(matched_pairs) / len(words1)

    # Determine similarity threshold based on first sentence length
    if len(words1) == 1:
        threshold = 0.9  # Single word needs high match
    elif len(words1) == 2:
        threshold = 0.8  # Two words need good match
    else:
        threshold = 0.7  # Longer sentences can be more flexible

    details = {
        "matches": matched_pairs,
        "unmatched": unmatched_words
    }

    return match_score >= threshold, round(match_score, 3), details


def json2data(json_input):
    try:
        data = json.dumps(json_input).encode('utf-8')
        return data
    except json.JSONDecodeError:
        return None
