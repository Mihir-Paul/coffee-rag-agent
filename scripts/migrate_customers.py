"""
Migration & Seeding Utility for CoffeeMind AI Customer Profiles into Supabase.

This script reads local customer profiles from `coffee_agent/data/customers.json`
(C001, C002, etc.) and safely seeds or migrates them into the Supabase database.
"""

import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migrate_customers")

CUSTOMERS_FILE = Path(__file__).resolve().parent.parent / "coffee_agent" / "data" / "customers.json"


def migrate_to_supabase():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Skipping live Supabase DB migration.")
        logger.info("Local JSON fallback data in coffee_agent/data/customers.json will continue to be preserved.")
        return False

    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        
        if not CUSTOMERS_FILE.exists():
            logger.error(f"Local customer file not found: {CUSTOMERS_FILE}")
            return False

        with open(CUSTOMERS_FILE, "r", encoding="utf-8") as f:
            customers = json.load(f)

        logger.info(f"Found {len(customers)} local customer profiles to seed/migrate.")

        for item in customers:
            customer_id = item.get("customer_id")
            name = item.get("name")
            if not customer_id or not name:
                continue

            # Check if customer record exists by customer_id
            existing = supabase.table("customers").select("*").eq("customer_id", customer_id).execute()
            
            cust_record_id = None
            if existing.data and len(existing.data) > 0:
                cust_record_id = existing.data[0]["id"]
                logger.info(f"Customer {customer_id} ({name}) already exists in Supabase.")
            else:
                # Create customer record (without auth_user_id until user registers)
                inserted = supabase.table("customers").insert({
                    "customer_id": customer_id,
                    "name": name
                }).execute()
                if inserted.data:
                    cust_record_id = inserted.data[0]["id"]
                    logger.info(f"Migrated Customer {customer_id} ({name}) to Supabase.")

            if cust_record_id:
                # Upsert preference
                pref_data = {
                    "customer_id": cust_record_id,
                    "temperature": item.get("preferred_temperature", "Cold"),
                    "sweetness": item.get("preferred_sweetness", "Medium"),
                    "milk_preference": item.get("preferred_milk", "Oat Milk"),
                    "caffeine_preference": item.get("caffeine_preference", "Medium"),
                    "budget": float(item.get("budget_inr", 250)),
                    "dietary_restrictions": item.get("dietary_restrictions", [])
                }
                supabase.table("customer_preferences").upsert(pref_data, on_conflict="customer_id").execute()
                logger.info(f"Upserted preferences for {customer_id}.")

        logger.info("Supabase Customer Migration completed successfully.")
        return True

    except Exception as e:
        logger.error(f"Migration error: {e}")
        return False


if __name__ == "__main__":
    migrate_to_supabase()
