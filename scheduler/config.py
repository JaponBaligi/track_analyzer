import os
from dotenv import load_dotenv

load_dotenv()

SCHEDULER_INTERVAL_MINUTES = int(os.getenv("SCHEDULER_INTERVAL_MINUTES", "30"))
