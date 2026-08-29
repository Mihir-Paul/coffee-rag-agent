"""Customer Persistent Memories ADK Tools."""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# In-memory store for fallback offline memory storage
_MEMORY_STORE: Dict[str, List[Dict[str, Any]]] = {}


def get_customer_memories(customer_id: str) -> Dict[str, Any]:
    """Retrieve saved personal coffee preferences and notes remembered for a customer.
    
    Args:
        customer_id: Customer ID or authenticated user ID.
        
    Returns:
        List of remembered facts, roast notes, or personal requests.
    """
    clean_id = customer_id.strip()
    memories = _MEMORY_STORE.get(clean_id, [])
    
    return {
        "status": "success",
        "customer_id": clean_id,
        "memories": [m["text"] for m in memories if m.get("is_active", True)]
    }


def save_customer_memory(customer_id: str, memory_text: str) -> Dict[str, Any]:
    """Store a persistent memory or personal coffee preference requested by the user.
    
    Args:
        customer_id: Customer ID or authenticated user ID.
        memory_text: Specific fact or preference to remember (e.g. 'Prefers Ethiopian light roast with no syrup').
        
    Returns:
        Confirmation status object.
    """
    clean_id = customer_id.strip()
    clean_text = memory_text.strip()
    
    if not clean_text:
        return {"status": "error", "message": "Memory text cannot be empty."}

    if clean_id not in _MEMORY_STORE:
        _MEMORY_STORE[clean_id] = []

    record = {
        "text": clean_text,
        "is_active": True
    }
    _MEMORY_STORE[clean_id].append(record)
    logger.info(f"Saved memory for customer {clean_id}: {clean_text}")

    return {
        "status": "success",
        "message": f"Memory saved: '{clean_text}'",
        "customer_id": clean_id
    }
